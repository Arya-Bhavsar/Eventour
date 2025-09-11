### Comment from Rahul:
### There are two necessary endpoints needed for our API:
# 1. To populate the Vector DB based on location/time preferences 
# 2. To get an answer to a query for recommendations 

# These refer to the two sections where an arrow goes from the Frontend Layer to the Backend Layer up to the next time an arrow goes Back to Front on the workflow
# The two sections are populating the DB and answering a query. 
# 



from typing import Union
from fastapi import FastAPI
from langchain_cohere import CohereEmbeddings, ChatCohere
from langchain_chroma import Chroma
from langchain import hub
from langchain.chat_models import init_chat_model


app = FastAPI()



#Function To Populate Vector Database
@app.get("/populate-db/")
def populate_db(start_time: str = None, end_time: str = None , location:str = None):
    #call APIs

    #populate DB
    pass

#Function To Get Answer to Question
@app.get("/get-answer/{query}")
def answer(query: str):
    #retrieve context from Chroma DB 
    vectorstore = connect_to_chroma()
    context = vectorstore.similarity_search(query)
    #call LLM with context
    prompt = hub.pull("rlm/rag-prompt")
    docs_content = "\n\n".join(doc.page_content for doc in context)

    messages = prompt.invoke({"question": query, "context": docs_content})
    llm = init_chat_model("command-r-plus", model_provider="cohere")
    response = llm.invoke(messages)

    #output answer
    return {"answer": response.content}
    

#helper functions
def connect_to_chroma():
    #Rahul on 9/12: UPDATE the below with the correct details
    return Chroma(
        collection_name="my_docs",
        embedding_function=CohereEmbeddings(),
        host="YOUR.CHROMA.SERVER.IP",   # or DNS name
        port=8000,                      # default is 8000
        ssl=False                       # set True if you front it with TLS
    )