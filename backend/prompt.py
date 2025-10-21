from pydantic import BaseModel, Field
from typing import List

class EventInfo(BaseModel):
    name: str = Field(description="The event's name")
    description: str = Field(description="A description of the event in as much detail as possible")
    link: str = Field(description="A link for the event, if applicable.")

class EventList(BaseModel):
    """A list of events and attractions."""
    events: List[EventInfo]
      

LIST_PROMPT = """You are an expert travel concierge specializing in personalized event recommendations.

**YOUR TASK:**
Analyze the provided events and user preferences to recommend exactly 3 events that best match the user's interests.

**AVAILABLE EVENTS:**
{event_context}

**USER PREFERENCES:**
{user_preference}

**INSTRUCTIONS:**
2. Choose events that closely align with the user's stated preferences
3. Do NOT use external knowledge or events not listed above
4. Include event links when available
5. Provide a detailed explanation for each recommendation

**OUTPUT FORMAT:**
Please format your response exactly like this:

**[Event Name]** - [Date/Time]
   - Why it's perfect for you: [detailed explanation]
   - Link: [URL if available]

I hope these recommendations help make your visit memorable!

**CRITICAL:** Only recommend events from the provided context. Do not suggest events from your training data."""
SUMMARIZE_CONTEXT_PROMPT = """You are a professional concise writer and have been given the task of taking the 
lengthy context history between a user and a chatbot assistant. Take the given chat history and write a summary of no more than a paragraph or two (depending on context length)
summarizing the given chat context history.

### CHAT CONTEXT HISTORY###
History: 

"""
