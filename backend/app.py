### Comment from Rahul:
### There are two necessary endpoints needed for our API:
# 1. To populate the Vector DB based on location/time preferences 
# 2. To get an answer to a query for recommendations 

# These refer to the two sections where an arrow goes from the Frontend Layer to the Backend Layer up to the next time an arrow goes Back to Front on the workflow
# The two sections are populating the DB and answering a query. 
# 
# there are 3 endpoints below. The first two are two versions of the first necessary endpoint, based on different levels of complexity 



from typing import Union

from fastapi import FastAPI

app = FastAPI()

#Function To Populate Vector Database Assuming Location is Columbus, and Dates are Next Few Days
@app.get("/populate-db-default/")
def populate_db():
    pass

#Function To Populate Vector Database
@app.get("/populate-db/")
def populate_db(start_time: str, end_time: str, location: str):
    #call APIs

    #populate DB
    pass

#Function To Get Answer to Question
@app.get("/get-answer/{query}")
def answer(query: str):
    #retrieve context from Chroma DB 

    #call LLM with context

    #output answer
    pass