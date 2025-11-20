### Comment from Rahul:
### There are two necessary endpoints needed for our API:
# 1. To populate the Vector DB based on location/time preferences 
# 2. To get an answer to a query for recommendations 

# These refer to the two sections where an arrow goes from the Frontend Layer to the Backend Layer up to the next time an arrow goes Back to Front on the workflow
# The two sections are populating the DB and answering a query. 
# 



from multiprocessing import context
from typing import Union
import os
import re
import requests
import random
from datetime import datetime
from fastapi import FastAPI

from langchain.prompts import PromptTemplate

from fastapi.middleware.cors import CORSMiddleware
from langchain_cohere import CohereEmbeddings, ChatCohere
from langchain_chroma import Chroma
from langchain import hub
from langchain.chat_models import init_chat_model
from langchain.output_parsers import PydanticOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from prompt import LIST_PROMPT
from prompt import EventInfo, EventList
from prompt import LIST_PROMPT, SUMMARIZE_CONTEXT_PROMPT, RESPONSE_SUMMARY_PROMPT

load_dotenv()
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Allow your React app
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, etc.)
    allow_headers=["*"],  # Allow all headers
)

@app.get("/condense-context/{context}")
def condense_context(context: str = None):
    try:
        llm = init_chat_model(
            "command-a-03-2025", 
            model_provider="cohere",
            api_key=os.getenv("COHERE_KEY")
        )
        
        # Create the prompt template
        prompt = PromptTemplate.from_template(SUMMARIZE_CONTEXT_PROMPT)
        
        # Create the chain
        chain = prompt | llm
        
        # Invoke with the context parameter (not concatenation)
        response = chain.invoke({"context": context})  # Pass context as parameter
        
        return {"condensed_context": response.content}
        
    except Exception as e:
        return {"error": f"Failed to condense context: {str(e)}"}
    

@app.get("/chance-of-attendance")
def chance_of_attendance():
    # Generate random chance between 0.01% and 3.00%
    chance = round(random.uniform(0.01, 20.0), 5)
    return {"chance_percentage": chance}
    

#Function To Populate Vector Database
@app.get("/populate-db/")
def populate_db(start_time: str = None, end_time: str = None , location:str = None):
    # Call TicketMaster and Google Places APIs
    ticket_master_data = get_ticket_master_events(start_time, end_time, location)
    google_places_data = get_google_places_data(location)
    
    # Populate DB
    result = get_data_in_chroma(ticket_master_data, google_places_data, location)
    
    return {"message": result}  # Return the result instead of pass

#generate response summary with chat history
@app.get("/generate-summary/")
def generate_response_summary_with_history(user_query: str = None, events: str = None, chat_history: str = ""):
    try:
        prompt = PromptTemplate(template=RESPONSE_SUMMARY_PROMPT, 
                                input_variables=["user_query", "events", "chat_history"]
                                )
        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",
            api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.3,
            max_output_tokens=2048,
        )

        chain = prompt | llm

        response = chain.invoke({
            "user_query": user_query, 
            "events": events,
            "chat_history": chat_history if chat_history else "No previous conversation"
        })

        return response.content
         
    except Exception as e:
        return {"error": f"Failed to generate summary: {str(e)}"}

#compare differences (legacy endpoint - redirects to new one)
@app.get("/compare-differences/")
def summarize_difference(table_1: str = None, table_2: str = None):
    # Legacy endpoint - table_1 is query, table_2 is events
    return generate_response_summary_with_history(user_query=table_1, events=table_2, chat_history="")


#Function To Get Answer to Question
@app.get("/get-answer/{query}")
def answer(query: str):
    try:
        # Retrieve context from Chroma DB 
        vectorstore = connect_to_chroma()
        context = vectorstore.similarity_search(query, k=30)  # Get more results to filter
        
        # Deduplicate results based on content
        seen_names = set()
        unique_context = []
        for doc in context:
            # Extract event/place name from metadata or content
            name = doc.metadata.get('name', '')
            if name and name not in seen_names:
                seen_names.add(name)
                unique_context.append(doc)
        
        # Limit to top 15 unique results
        unique_context = unique_context[:15]
        
        # Call LLM with context
        #parser = PydanticOutputParser(pydantic_object=EventList)
        prompt = PromptTemplate(template=LIST_PROMPT, 
                                input_variables=["user_preference", "event_context"]
                                )
        
        docs_content = "\n\n".join(doc.page_content for doc in unique_context)

        # llm = init_chat_model(
        #     "command-a-03-2025", 
        #     model_provider="cohere",
        #     api_key=os.getenv("COHERE_KEY")  # Add the API key here
        # )

        llm = ChatGoogleGenerativeAI(
            model="gemini-2.5-flash",               # good price/perf & on free tier
            api_key=os.getenv("GOOGLE_API_KEY"),
            temperature=0.2,
            max_output_tokens=2048,
        )

        structured_llm = llm.with_structured_output(EventList)

        chain = prompt | structured_llm 
        response = chain.invoke({"user_preference": query, "event_context": docs_content})
        print(response)
        if response is None:
            return {"answer": None}
        event_list_of_dicts = [event.model_dump() for event in response.events]
        
        return {"answer": event_list_of_dicts}
    except Exception as e:
        return {"error": f"Failed to get answer: {str(e)}"}
    

#helper functions
def connect_to_chroma():
    return Chroma(
        collection_name="my_docs",
        embedding_function=CohereEmbeddings(
            cohere_api_key=os.getenv("COHERE_API_KEY"),
            model="embed-english-v3.0"  # Add the required model parameter
        ),
        # Use your hosted ChromaDB credentials from .env
        host=os.getenv("CHROMA_HOST", "api.trychroma.com"),  # Default to hosted Chroma
        port=443,  # HTTPS port for hosted Chroma
        ssl=True,  # Enable SSL for hosted connection
        headers={
            "Authorization": f"Bearer {os.getenv('CHROMA_API_KEY')}",
            "X-Chroma-Token": os.getenv("CHROMA_API_KEY")
        },
        tenant=os.getenv("CHROMA_TENANT"),
        database=os.getenv("CHROMA_DATABASE")
    )

def get_google_places_data(location: str = None):
    
    google_url = "https://places.googleapis.com/v1/places:searchText"
    headers = {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": os.getenv("GOOGLE_MAPS_KEY"),
        "X-Goog-FieldMask": "places.displayName,places.primaryTypeDisplayName,places.googleMapsLinks,places.editorialSummary"
    }

    # Make multiple queries to get more diverse results (up to 100 places)
    search_queries = [
        f'things to do in {location}',
        f'attractions in {location}',
        f'tourist destinations in {location}',
        f'entertainment in {location}',
        f'landmarks in {location}'
    ]
    
    all_places = []
    seen_place_ids = set()
    
    for query in search_queries:
        payload = {
            "textQuery": query,
            "maxResultCount": 20,
        }
        response = requests.post(google_url, headers=headers, json=payload)
        if response.status_code == 200:
            data = response.json()
            places = data.get('places', [])
            
            # Deduplicate places by name
            for place in places:
                place_name = place.get('displayName', {}).get('text', '')
                if place_name and place_name not in seen_place_ids:
                    seen_place_ids.add(place_name)
                    all_places.append(place)
        else:
            print(f"Error for query '{query}': {response.status_code}")
            print(response.text)
    
    return {"places": all_places}


def get_ticket_master_events(start_time: str = None, end_time: str = None , location:str = None):
    ticket_master_url = "https://app.ticketmaster.com/discovery/v2/events"
    ticket_master_key = os.getenv("TICKETMASTER_KEY")
    
    # Debug: Print what we received
    print(f"DEBUG - Received start_time: {start_time}")
    print(f"DEBUG - Received end_time: {end_time}")
    print(f"DEBUG - Received location: {location}")
    
    # Fix: Parse location properly instead of hardcoding
    if location and "," in location:
        city, state = location.split(",")
        state = state.strip()
    
    # Parse and format dates properly
    # Frontend sends full date strings like "Mon Dec 01 2025 00:00:00 GMT-0500 (Eastern Standard Time)T00:00:00"
    # We need to extract just the date part and format it as ISO 8601
    if start_time:
        # Extract the date components from the string
        # Split by 'T' and take first part, then parse with datetime
        date_part = start_time.split('T')[0] if 'T' in start_time else start_time
        try:
            # Parse various date formats
            dt = datetime.strptime(date_part, "%a %b %d %Y %H:%M:%S GMT%z (%Z)")
            start_time = dt.strftime("%Y-%m-%dT00:00:00Z")
        except:
            try:
                # Try ISO format
                dt = datetime.fromisoformat(start_time.replace('Z', ''))
                start_time = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except:
                # If all parsing fails, try to extract YYYY-MM-DD pattern
                import re
                match = re.search(r'(\w{3})\s+(\w{3})\s+(\d{2})\s+(\d{4})', date_part)
                if match:
                    month_map = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}
                    _, month, day, year = match.groups()
                    start_time = f"{year}-{month_map[month]}-{day}T00:00:00Z"
    
    if end_time:
        date_part = end_time.split('T')[0] if 'T' in end_time else end_time
        try:
            dt = datetime.strptime(date_part, "%a %b %d %Y %H:%M:%S GMT%z (%Z)")
            end_time = dt.strftime("%Y-%m-%dT23:59:59Z")
        except:
            try:
                dt = datetime.fromisoformat(end_time.replace('Z', ''))
                end_time = dt.strftime("%Y-%m-%dT%H:%M:%SZ")
            except:
                import re
                match = re.search(r'(\w{3})\s+(\w{3})\s+(\d{2})\s+(\d{4})', date_part)
                if match:
                    month_map = {'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
                                'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
                                'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'}
                    _, month, day, year = match.groups()
                    end_time = f"{year}-{month_map[month]}-{day}T23:59:59Z"
    
    # Try using startDateTime and endDateTime instead of localStartEndDateTime
    # API docs show both options available
    print(f"DEBUG - Using startDateTime: {start_time}")
    print(f"DEBUG - Using endDateTime: {end_time}")
    
    params = {
        "apikey": ticket_master_key,
        "city": city,
        "stateCode": state,
        "startDateTime": start_time,
        "endDateTime": end_time,
        "size": 200,  # TicketMaster allows up to 200 results per request
    }
    
    print(f"DEBUG - Full params being sent: {params}")
    print(f"DEBUG - Request URL: {ticket_master_url}")
    
    response = requests.get(ticket_master_url, params = params)
    
    print(f"DEBUG - Response status: {response.status_code}")
    if response.status_code != 200:
        print(f"DEBUG - Error response: {response.text}")
    
    if response.status_code == 200:
        data = response.json()
        
        # Print readable results to console
        print("\n" + "="*80)
        print(f"TICKETMASTER API RESULTS FOR {location}")
        print("="*80)
        
        events = data.get('_embedded', {}).get('events', [])
        print(f"\nTotal events found: {len(events)}")
        print(f"Date range: {start_time} to {end_time}\n")
        
        for idx, event in enumerate(events, 1):
            name = event.get('name', 'Unknown Event')
            date = event.get('dates', {}).get('start', {}).get('localDate', 'N/A')
            time = event.get('dates', {}).get('start', {}).get('localTime', 'N/A')
            venue = event.get('_embedded', {}).get('venues', [{}])[0].get('name', 'N/A')
            genre = event.get('classifications', [{}])[0].get('genre', {}).get('name', 'N/A')
            url = event.get('url', 'N/A')
            
            print(f"{idx}. {name}")
            print(f"   Date/Time: {date} at {time}")
            print(f"   Venue: {venue}")
            print(f"   Genre: {genre}")
            print(f"   URL: {url[:60]}..." if len(url) > 60 else f"   URL: {url}")
            print()
        
        print("="*80 + "\n")
        
        return data
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return {"error": f"Status: {response.status_code}"}  # Fix: Add return statement
    
def get_data_in_chroma(tm_data, google_data, location):
    vectorstore = connect_to_chroma()
    
    # Clear existing data for this location to avoid duplicates
    try:
        collection_data = vectorstore.get()
        if collection_data['ids']:
            # Filter IDs that match this location (you could make this more sophisticated)
            print(f"Clearing existing database to avoid duplicates...")
            vectorstore.delete(ids=collection_data['ids'])
    except Exception as e:
        print(f"Note: Could not clear existing data: {e}")
    
    documents_to_add = []
    metadatas_to_add = []
    ids_to_add = []
    seen_event_ids = set()  # Track event IDs to avoid duplicates
    
    # Parse Events
    events = tm_data.get('_embedded', {}).get('events', [])
    print(events)
    for event in events:
        event_id = event.get('id', None)
        
        # Skip if we've already seen this event
        if event_id and event_id in seen_event_ids:
            print(f"- Skipping duplicate event: {event.get('name', 'Unknown')}")
            continue
        
        if event_id:
            seen_event_ids.add(event_id)
        name = event.get('name', 'Unknown Event')
        venue = event.get('_embedded', {}).get('venues', [{}])[0].get('name', 'N/A')
        date = event.get('dates', {}).get('start', {}).get('localDate', 'N/A')
        time = event.get('dates', {}).get('start', {}).get('localTime', 'N/A')
        genre = event.get('classifications', [{}])[0].get('genre', {}).get('name', 'N/A')
        description = event.get('description', 'N/A')
        url = event.get('url', 'N/A')
        
        print(f"- Parsing event: {name}")
        
        # Include metadata in the document text for better searchability
        document = f"""Event: {name}
Type: {genre}
Venue: {venue}
Date: {date}
Time: {time}
Category: live event
Location: {location}
URL: {url}
Description: {description}."""
        documents_to_add.append(document)
        
        metadata = {
            "type": "event",
            "name": name,
            "venue": venue,
            "date": date,
            "time": time,
            "genre": genre,
            "url": url
        }
        metadatas_to_add.append(metadata)
        ids_to_add.append(f"event_{event.get('id', f'unknown_{len(ids_to_add)}')}") 
    
    # Parse Places
    places = google_data.get('places', [])
    print(places)
    for i, place in enumerate(places):
        name = place.get('displayName', {}).get('text', 'Unknown Place')
        category = place.get('primaryTypeDisplayName', {}).get('text', 'Unknown Category')
        maps_url = place.get('googleMapsLinks', {}).get('placeUri', '')
        description = place.get('editorialSummary', {}).get('text', 'No Description')

        print(f"- Parsing place: {name}")
        
        # Include metadata in the document text for better searchability
        document = f"""Place: {name}
Type: {category}
Category: local attraction
Location: {location}
Maps URL: {maps_url}
Description: {description}"""
        documents_to_add.append(document)
        
        metadata = {
            "type": "place",
            "name": name,
            "category": category,
            "location": location,
            "maps_url": maps_url
        }
        metadatas_to_add.append(metadata)

        sanitized_name = re.sub(r'[^a-zA-Z0-9]', '', name).lower()
        ids_to_add.append(f"place_{i}_{sanitized_name}")
    
    # ADD TO VECTOR DATABASE USING LANGCHAIN + COHERE
    if documents_to_add:
        try:
            vectorstore.add_texts(
                texts=documents_to_add,
                metadatas=metadatas_to_add,
                ids=ids_to_add
            )
            return f"Successfully added {len(documents_to_add)} documents to ChromaDB"
        except Exception as e:
            print(f"Error adding to ChromaDB: {e}")
            return f"Error: {str(e)}"
    else:
        return "No documents to add"

# Add this endpoint to your app.py
@app.post("/clear-db/")
def clear_database():
    try:
        vectorstore = connect_to_chroma()
        
        # Get all document IDs in the collection
        collection_data = vectorstore.get()
        if collection_data['ids']:
            # Delete all documents
            vectorstore.delete(ids=collection_data['ids'])
            return {"message": f"Cleared {len(collection_data['ids'])} documents from ChromaDB"}
        else:
            return {"message": "Collection is already empty"}
    except Exception as e:
        return {"error": f"Failed to clear database: {str(e)}"}
