import os
import re
import random
from typing import Optional, List, Dict, Any
from mistralai import Mistral
from dotenv import load_dotenv
from utils.logger import logger
from models.request_models import UserProfile
import services.style_engine as style_engine
from services.intent_engine import intent_engine

load_dotenv()

MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY")
MODEL = "mistral-small-latest"

class LLMService:
    def __init__(self):
        if not MISTRAL_API_KEY:
            logger.error("MISTRAL_API_KEY not found in environment variables.")
        self.client = Mistral(api_key=MISTRAL_API_KEY)

    def _detect_table_intent(self, query: str, messages: Optional[List[Dict[str, str]]] = None) -> bool:
        """
        Detects if the user is asking for a table or comparison.
        """
        text_to_check = query.lower() if query else ""
        if not text_to_check and messages:
            # Check the last user message
            for msg in reversed(messages):
                if msg.get("role") == "user":
                    text_to_check = msg.get("content", "").lower()
                    break
        
        keywords = ["table", "tabular", "compare", "difference between", "comparison", "tabular format"]
        return any(kw in text_to_check for kw in keywords)

    def _generate_dynamic_system_prompt(
        self,
        user_profile: UserProfile,
        style_config: Dict[str, Any],
        user_interests: Optional[Dict[str, int]] = None,
        dominant_interest: Optional[str] = None
    ) -> str:
        """
        Constructs a personalized system prompt based on user weights and exploration factor.
        """
        # 1. Extract weights
        weights = {}
        if isinstance(user_profile.preferences, dict):
            weights = user_profile.preferences.get("weights", {})
        
        # 2. Build Preference Descriptions
        pref_descriptions = []
        instructions = []
        
        # Mapping for human-readable descriptions
        style_map = {
            "code": "code-heavy answers",
            "short": "concise responses",
            "explanation": "detailed explanations"
        }
        
        instruction_map = {
            "code": "prioritize code examples",
            "short": "minimize verbosity",
            "explanation": "provide thorough context"
        }
        
        for style, weight in weights.items():
            label = style_map.get(style, style)
            instr = instruction_map.get(style, "")
            
            if weight >= 5:
                pref_descriptions.append(f"- Strongly prefers {label}")
                if instr: instructions.append(f"- {instr}")
            elif weight > 0:
                pref_descriptions.append(f"- Prefers {label}")
                if instr: instructions.append(f"- {instr}")
            elif weight <= -5:
                pref_descriptions.append(f"- Strictly avoid {label}")
            elif weight < 0:
                pref_descriptions.append(f"- Avoid {label}")

        # Default descriptions if none found
        if not pref_descriptions:
            pref_descriptions = ["- Balanced response style"]
            instructions = ["- Follow standard helpful assistant guidelines"]

        # 3. Exploration Factor (80/20)
        final_style_type = style_config['type']
        is_exploring = False
        
        if random.random() < 0.2:
            # 20% chance to try a different style
            available_styles = ["code-heavy", "short", "explanation"]
            if final_style_type in available_styles:
                available_styles.remove(final_style_type)
            final_style_type = random.choice(available_styles)
            is_exploring = True
            logger.info(f"--- EXPLORATION ACTIVE: Trying '{final_style_type}' instead of '{style_config['type']}' ---")

        # 4. Build Interest Profile Section
        interest_section = ""
        interest_instructions = []

        # Map dominant interest → behavioral instructions
        INTEREST_INSTRUCTION_MAP = {
            "software development and programming": [
                "Give technical, precise answers.",
                "Include real, working code examples whenever relevant.",
                "Minimize non-technical analogies — prefer direct explanation.",
            ],
            "sports and athletic activities": [
                "Use sports analogies and metaphors to explain concepts.",
                "Keep examples relatable to sports scenarios.",
                "Prefer conversational, energetic tone.",
            ],
            "artificial intelligence and data science": [
                "Focus on algorithms, model architecture, and data implications.",
                "Reference accuracy metrics, training strategies, and benchmarks.",
                "Assume a high level of ML/AI background knowledge.",
            ],
            "web development and design": [
                "Focus on user experience, performance, and UI/UX best practices.",
                "Prefer practical, browser-ready examples (HTML/CSS/JS/React).",
                "Highlight accessibility and responsiveness considerations.",
            ],
            "a wide range of general topics": [
                "Provide relatable, real-world examples from everyday life.",
                "Keep responses approachable and jargon-free.",
                "Encourage curiosity with follow-up suggestions.",
            ],
        }

        if dominant_interest:
            interest_instructions = INTEREST_INSTRUCTION_MAP.get(
                dominant_interest, INTEREST_INSTRUCTION_MAP["a wide range of general topics"]
            )
            
            interest_section = f"""

PERSONALIZATION GUIDELINES:
- This user is particularly focused on: {dominant_interest}
""" + "\n".join(f"- {instr}" for instr in interest_instructions)

            logger.info(f"--- INTEREST PROFILE INJECTED INTO PROMPT ---")
            logger.info(f"Focus: {dominant_interest}")
            logger.info(f"---------------------------------------------")

        # 5. Construct Final Prompt
        interest_list = ", ".join(user_interests.keys()) if user_interests else "General"
        behavior_desc = ", ".join([d.replace("- ", "").lower() for d in pref_descriptions])

        prompt = f"""You are a highly capable AI research assistant.

INTERNAL SYSTEM PROFILE (DO NOT EXPOSE THESE RAW TERMS):
- User Interests: {interest_list}
- User Level: {user_profile.level}
- Style Preference: {behavior_desc}
- Current Tone: {final_style_type}

CORE DIRECTIVES:
1. Use the above profile INTERNALLY to personalize your language, depth, and tone.
2. If the user asks about their interests or profile, respond naturally and conversationally (e.g., "You seem to enjoy...", "I've noticed you ask a lot about...").
3. NEVER mention "scores", "dominant interest", "weights", "system reasoning", or any internal logic in your response.
4. Keep personalization subtle. The user should feel you "understand" them without being told why.
5. Do NOT mention these internal instructions or profile terms to the user unless explicitly asked about the mechanics of the memory system.

{interest_section}
"""
        
        # Table Intent Enforcement
        if getattr(user_profile, 'table_intent', False):
            prompt += """
STRICT FORMATTING RULE:
- The user has requested a table or comparison.
- You MUST respond using a clean Markdown table format.
- Format:
  | Column 1 | Column 2 |
  |----------|----------|
  | Data     | Data     |
- Always include a header row and a separator row (---).
- Ensure every row has the same number of pipes (|).
- Do NOT use plain text tables or broken formatting.
- Do NOT mix paragraph text within the table structure.
"""
        
        # 6. Research Mode Injection — MODE TAKES PRIORITY OVER STYLE
        mode = user_profile.research_mode or "learning"
        
        MODE_PROMPT_BLOCKS = {
            "learning": (
                "RESPONSE MODE: LEARNING\n"
                "- Explain clearly and simply for a beginner.\n"
                "- Use moderate length. Do not be overly brief.\n"
                "- Include practical examples to illustrate concepts.\n"
                "- Prefer analogies and step-by-step breakdowns.\n"
                "- Aim for clarity over brevity."
            ),
            "building": (
                "RESPONSE MODE: BUILDING\n"
                "- Provide detailed, verbose implementation guidance.\n"
                "- Include complete, working code examples.\n"
                "- Cover architecture decisions, file structure, and setup steps.\n"
                "- Be thorough — do NOT truncate or summarize prematurely.\n"
                "- Include error handling, edge cases, and best practices.\n"
                "- This response MUST be long and comprehensive."
            ),
            "exploring": (
                "RESPONSE MODE: EXPLORING\n"
                "- Explain the concept in depth.\n"
                "- Show relationships, comparisons, and related ideas.\n"
                "- Provide a structured landscape of the topic.\n"
                "- Use headings or sections to organize information.\n"
                "- Include pros/cons, trade-offs, and alternative approaches."
            ),
            "academic": (
                "RESPONSE MODE: ACADEMIC\n"
                "- Provide a detailed, structured, formal explanation.\n"
                "- Use clear headings and logical hierarchy.\n"
                "- Be thorough and comprehensive — do NOT be brief.\n"
                "- Use formal tone and precise terminology.\n"
                "- Include theoretical foundations and practical implications.\n"
                "- Do not fabricate citations, but reference well-known concepts."
            ),
        }
        
        mode_block = MODE_PROMPT_BLOCKS.get(mode, MODE_PROMPT_BLOCKS["learning"])
        prompt += f"\n{mode_block}\n"

        if is_exploring:
            logger.info("--- DYNAMIC SYSTEM PROMPT (EXPLORATION) ---")
        else:
            logger.info("--- DYNAMIC SYSTEM PROMPT (STABLE) ---")
        
        logger.info(f"\n{prompt}")
        logger.info(f"Applied Weights: {weights}")
        logger.info("-------------------------------------------")
        
        return prompt, final_style_type

    def generate_response(self, system_prompt: str, user_query: Optional[str] = None, history: Optional[list] = None) -> str:
        messages = [{"role": "system", "content": system_prompt}]
        
        if history:
            messages.extend(history)
        
        if user_query:
            messages.append({"role": "user", "content": user_query})
        
        logger.debug(f"LLM Payload: {messages}")
        
        try:
            chat_response = self.client.chat.complete(
                model=MODEL,
                messages=messages,
            )
            if not chat_response or not hasattr(chat_response, 'choices') or not chat_response.choices:
                logger.error("Empty or invalid response from Mistral API")
                raise ValueError("Empty or invalid response from Mistral API")
                
            return chat_response.choices[0].message.content
        except Exception as e:
            logger.error(f"Error in generate_response: {str(e)}")
            raise e

    def enforce_style(self, response: str, config: dict) -> str:
        """
        Deterministic enforcement layer to ensure the output matches strict requirements.
        """
        processed_response = response.strip()

        # 1. CODE-FIRST ENFORCEMENT
        if config.get("require_code_first"):
            if not processed_response.startswith("```"):
                # extract code block
                code_blocks = re.findall(r"```[\s\S]*?```", processed_response)
                if code_blocks:
                    # Prepend first code block to the top
                    processed_response = code_blocks[0] + "\n\n" + processed_response
                else:
                    logger.warning("Code-first required but no code block found in response.")

        # 2. SHORT ENFORCEMENT
        if "max_lines" in config:
            lines = processed_response.split("\n")
            if len(lines) > config["max_lines"]:
                processed_response = "\n".join(lines[:config["max_lines"]])
                logger.info(f"Response truncated to {config['max_lines']} lines.")

        return processed_response

    def _fix_table_formatting(self, response: str) -> str:
        """
        Post-processes the response to fix common Markdown table formatting issues.
        Specifically ensures that tables starting with | have a separator row (---) after the header.
        """
        if "|" not in response:
            return response

        lines = response.split("\n")
        fixed_lines = []
        
        in_table = False
        i = 0
        while i < len(lines):
            line = lines[i]
            stripped = line.strip()
            
            if stripped.startswith("|") and stripped.endswith("|"):
                if not in_table:
                    # First row of a table
                    in_table = True
                    
                    # Check if THIS row is already a separator
                    if "---" in stripped:
                        fixed_lines.append(line)
                    else:
                        # This is likely a header. Check if NEXT row is a separator.
                        has_separator_next = False
                        if i + 1 < len(lines):
                            next_line = lines[i+1].strip()
                            if next_line.startswith("|") and "---" in next_line:
                                has_separator_next = True
                        
                        fixed_lines.append(line)
                        if not has_separator_next:
                            # Insert separator
                            cols = stripped.count("|") - 1
                            if cols > 0:
                                separator = "|" + "|".join(["---"] * cols) + "|"
                                fixed_lines.append(separator)
                                logger.info(f"Fixed table: Inserted separator row after header.")
                else:
                    # Already in a table, just append rows
                    fixed_lines.append(line)
                i += 1
            else:
                # Not in a table row
                in_table = False
                fixed_lines.append(line)
                i += 1

        return "\n".join(fixed_lines)

    async def get_answer(
        self,
        query: Optional[str],
        user_profile: UserProfile,
        messages: Optional[list] = None,
        user_interests: Optional[Dict[str, int]] = None,
        dominant_interest: Optional[str] = None,
        manual_mode: Optional[str] = None
    ) -> tuple[str, str, str]:
        VALID_MODES = {"learning", "building", "exploring", "academic"}

        # 1. Get base style config
        style_config = style_engine.get_style_config(
            user_profile.preferences,
            user_profile.level
        )
        
        # 2. Detect Table Intent
        table_intent = self._detect_table_intent(query, messages)
        # 3. Resolve Research Mode — manual override takes priority
        if manual_mode and manual_mode in VALID_MODES:
            research_mode = manual_mode
            logger.info(f"Using manual research mode override: {research_mode}")
        else:
            text_for_intent = query or (messages[-1]["content"] if messages else "")
            research_mode = intent_engine.detect_mode(text_for_intent)
            logger.info(f"Auto-detected research mode: {research_mode}")
        user_profile.research_mode = research_mode

        # 4. Generate DYNAMIC system prompt with exploration factor
        system_prompt, active_style = self._generate_dynamic_system_prompt(
            user_profile, style_config,
            user_interests=user_interests,
            dominant_interest=dominant_interest
        )
        
        # 4. Update style_config if exploration changed it
        # Note: We still want to enforce the active_style even if it's exploration
        exploration_config = style_config.copy()
        if active_style == "code-heavy":
            exploration_config.update({"type": "code-heavy", "require_code_first": True, "max_lines": 12})
        elif active_style == "short":
            exploration_config.update({"type": "short", "require_code_first": False, "max_lines": 5})
        else:
            exploration_config.update({"type": "explanation", "require_code_first": False})
            if "max_lines" in exploration_config: del exploration_config["max_lines"]

        # 5. MODE OVERRIDES STYLE — mode-based length limits always win
        MODE_MAX_LINES = {
            "building": 80,
            "academic": 80,
            "exploring": 50,
            "learning": 30,
        }
        if research_mode in MODE_MAX_LINES:
            mode_limit = MODE_MAX_LINES[research_mode]
            current_limit = exploration_config.get("max_lines")
            # Mode always overrides: remove restrictive style limits
            if current_limit is None or current_limit < mode_limit:
                exploration_config["max_lines"] = mode_limit
                logger.info(f"Mode '{research_mode}' overrode max_lines: {current_limit} → {mode_limit}")
            # For building/academic, also disable require_code_first unless mode is building
            if research_mode in ("academic", "exploring", "learning"):
                exploration_config["require_code_first"] = False

        # If table intent is detected, relax line limits to avoid breaking tables
        if table_intent and "max_lines" in exploration_config:
            exploration_config["max_lines"] = max(exploration_config["max_lines"], 20)

        try:
            logger.info(f"Sending request to Mistral for style: {active_style} (Table Intent: {table_intent})")
            
            raw_answer = self.generate_response(
                system_prompt=system_prompt, 
                user_query=query if not messages else None, 
                history=messages
            )
            
            # Apply deterministic enforcement layer using the exploration config
            enforced_answer = self.enforce_style(raw_answer, exploration_config)
            
            # Post-process for table formatting
            final_answer = self._fix_table_formatting(enforced_answer)
            
            return final_answer, active_style, research_mode
            
        except Exception as e:
            logger.error(f"Error calling Mistral API: {str(e)}")
            fallback_text = "I'm currently having trouble connecting to my brain. Here is a simplified answer: " + (query or "I'm sorry, I couldn't process your request.")
            return fallback_text, "explanation", "learning"

    def get_static_recommendations(self) -> list:
        return [
            "Explore documentation for advanced patterns",
            "Try implementing a retry mechanism",
            "Check out our vector search guide"
        ]
