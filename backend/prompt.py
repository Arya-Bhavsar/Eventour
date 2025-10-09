LIST_PROMPT = """You are a travel agent that recommends different events based on a user's preference. 
The events going on in the city during the user's stay are here: {event_context}. 
The user's needs are here: {user_preference}. 
Output all events that would be of interest to the user. Only use the above information. If you use your own knowledge base, deviating what I gave you, the application will fail. Please include links in your answer, if they are provided. 
If there is no link, then don't say anything about there being no link.

Don't include any small talk before or after the output. 

"""

from pydantic import BaseModel, Field
from typing import List

class EventInfo(BaseModel):
    name: str = Field(description="The event's name")
    description: str = Field(description="A description of the event in as much detail as possible")
    link: str = Field(description="A link for the event, if applicable.")

class EventList(BaseModel):
    """A list of events and attractions."""
    events: List[EventInfo]