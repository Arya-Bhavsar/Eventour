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
from fastapi import FastAPI

from langchain_core.prompts import PromptTemplate

from fastapi.middleware.cors import CORSMiddleware
from langchain_cohere import CohereEmbeddings, ChatCohere
from langchain_chroma import Chroma
from langchain import hub
from langchain.chat_models import init_chat_model
from langchain_core.output_parsers import PydanticOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv
from prompt import LIST_PROMPT
from prompt import EventInfo, EventList
from prompt import LIST_PROMPT, SUMMARIZE_CONTEXT_PROMPT

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
    

#Function To Populate Vector Database
@app.get("/populate-db/")
def populate_db(start_time: str = None, end_time: str = None , location:str = None):
    # Call TicketMaster and Google Places APIs
    ticket_master_data = get_ticket_master_events(start_time, end_time, location)
    google_places_data = get_google_places_data(location)
    
    # Populate DB
    result = get_data_in_chroma(ticket_master_data, google_places_data, location)
    
    return {"message": result}  # Return the result instead of pass

#Function To Get Answer to Question
@app.get("/get-answer/{query}")
def answer(query: str):
    try:
        # Retrieve context from Chroma DB 
        vectorstore = connect_to_chroma()
        context = vectorstore.similarity_search(query, k=15)
        
        # Call LLM with context
        #parser = PydanticOutputParser(pydantic_object=EventList)
        prompt = PromptTemplate(template=LIST_PROMPT, 
                                input_variables=["user_preference", "event_context"]
                                )
        
        docs_content = "\n\n".join(doc.page_content for doc in context)

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
        "X-Goog-Api-Key": os.getenv("GOOGLE_MAPS_KEY"),  # replace with your actual key
        "X-Goog-FieldMask": "places.displayName,places.primaryTypeDisplayName,places.googleMapsLinks"
    }

    payload = {
        "textQuery": f'things to do in {location}',
    }
    response = requests.post(google_url, headers=headers, json=payload)
    if response.status_code == 200:
        data = response.json()
        return data
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return {"error": f"Status: {response.status_code}"} 


def get_ticket_master_events(start_time: str = None, end_time: str = None , location:str = None):
    ticket_master_url = "https://app.ticketmaster.com/discovery/v2/events"
    ticket_master_key = os.getenv("TICKETMASTER_KEY")
    
    # Fix: Parse location properly instead of hardcoding
    if location and "," in location:
        city, state = location.split(",")
        state = state.strip()
    
    localStartEndDateTime = f'{start_time},{end_time}'
    params = {
        "apikey": ticket_master_key,
        "city": city,
        "stateCode": state,
        "localStartEndDateTime": localStartEndDateTime,
    }
    response = requests.get(ticket_master_url, params = params)
    if response.status_code == 200:
        data = response.json()
        return data
    else:
        print(f"Error: {response.status_code}")
        print(response.text)
        return {"error": f"Status: {response.status_code}"}  # Fix: Add return statement
    
def get_data_in_chroma(tm_data, google_data, location):
    vectorstore = connect_to_chroma()
    documents_to_add = []
    metadatas_to_add = []
    ids_to_add = []
    
    # Parse Events
    events = tm_data.get('_embedded', {}).get('events', [])
    print(events)
    for event in events:
        name = event.get('name', 'Unknown Event')
        venue = event.get('_embedded', {}).get('venues', [{}])[0].get('name', 'N/A')
        date = event.get('dates', {}).get('start', {}).get('localDate', 'N/A')
        time = event.get('dates', {}).get('start', {}).get('localTime', 'N/A')
        genre = event.get('classifications', [{}])[0].get('genre', {}).get('name', 'N/A')
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
Description: {name} is a live event of type {genre} at {venue} on {date} at {time}."""
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

        print(f"- Parsing place: {name}")
        
        # Include metadata in the document text for better searchability
        document = f"""Place: {name}
Type: {category}
Category: local attraction
Location: {location}
Maps URL: {maps_url}
Description: {name} is a {category} in {location}, a popular local attraction and destination."""
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
