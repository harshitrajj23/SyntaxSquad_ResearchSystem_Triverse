Here’s a polished, professional-grade README you can directly use for your project:

---

#  ThinkLoop — AI Research Chat System

ThinkLoop is an advanced AI-powered conversational platform designed to go beyond traditional chatbots. It combines intelligent response modes, contextual memory, and research-oriented outputs to create a **next-generation research assistant system**.

---

##  Overview

ThinkLoop enables users to interact with AI across multiple cognitive modes—ranging from simple explanations to structured research outputs—while maintaining persistent conversations and personalized recommendations.

---

##  Key Features

###  Multi-Mode AI Interaction

| Mode            | Purpose                              |
| --------------- | ------------------------------------ |
|    **Simple**   | Beginner-friendly explanations       |
|    **Build**    | Code generation + system design      |
|    **Explore**  | Concept expansion + related ideas    |
|    **Research** | Structured, citation-style responses |

---

###  Research Mode

* Academic-style structured answers
* Citation-ready UI (future real-paper integration)
* Designed for:

  * arXiv integration
  * Semantic Scholar APIs
* Built-in response rating system (UI layer)

---

###  Persistent Chat System

* Session-based conversations
* Each chat includes:

  * `chat_id`
  * Message history
* Dedicated **history page** for navigation

---

###  Smart Recommendations Engine

* Context-aware suggestions
* Related queries panel
* Inspired by modern search UX (Perplexity / Google AI)

---

###  User Memory System

* Tracks user preferences and interests
* Stored in Supabase (`user_profiles`)
* Dynamically influences AI responses

---

###  Authentication

* Email-based authentication via Supabase
* Secure session management using client SDK

---

##  Tech Stack

### Frontend

* **Next.js 16** (App Router)
* React
* Tailwind CSS
* Framer Motion

### Backend

* **Python (FastAPI)**
* Custom AI service layer

### Database

* **Supabase (PostgreSQL)**

---

##  Project Structure

```
src/
 ├── app/
 │   ├── chat/[chat_id]/
 │   ├── history/
 │   ├── auth/
 ├── components/
 ├── context/
 ├── services/
 ├── lib/
```

---

##  Setup Instructions

### 1️ Clone Repository

```bash
git clone <repo-url>
cd ThinkLoop
```

---

### 2️ Install Frontend

```bash
npm install
npm run dev
```

---

### 3️Backend Setup

```bash
cd ml-service
pip install -r requirements.txt
uvicorn app:app --reload
```

---

### 4️ Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

---

##  Database Schema (Supabase)

### chats

```sql
chat_id UUID PRIMARY KEY
user_id TEXT
created_at TIMESTAMP
```

---

### messages

```sql
id UUID PRIMARY KEY
chat_id UUID
role TEXT
content TEXT
created_at TIMESTAMP
```

---

### user_profiles

```sql
user_id TEXT PRIMARY KEY
interests JSONB
expertise_level TEXT
updated_at TIMESTAMP
```

---

##  Known Issue & Fix

###  Supabase Auth Lock Error

**Error:**

```
Lock "auth-token" was released because another request stole it
```

**Cause:**

* Multiple `getUser()` calls triggering race conditions

**Fix:**

* Use a global auth state
  **OR**
* Replace with:

```js
supabase.auth.getSession()
```

---

##  Roadmap / Future Improvements

* Real research paper integration (arXiv, Semantic Scholar)
* Embedding-based semantic search
* Paper relevance scoring
* Advanced personalization (memory weighting)
* Streaming AI responses

---

##  Test Queries

Try these to explore different modes:

* *What is machine learning?*
* *Build a REST API in Node.js*
* *Explain transformers in deep learning*

Switch modes to observe behavior differences.

---

##  Vision

ThinkLoop is not just a chatbot.

It is evolving into a **full-scale AI Research Assistant System** that integrates:

* Intelligent reasoning
* Knowledge grounding
* Interactive user experience

---

##  Author

**Harshit Raj**

---

##  Support

If you find this project useful:

 Star the repository
 Share feedback
 Contribute to future improvements

---

If you want, I can next:

* Make this **GitHub-optimized with badges + screenshots**
* Or tailor it for a **hackathon/demo pitch (judges-focused version)**
