FROM python:3.12-alpine

WORKDIR /app

COPY . .

RUN pip3 install -r requirements.txt

EXPOSE 5000

ENV FLASK_APP=app.py

CMD [ "flask", "run", "--host", "0.0.0.0", "--debug" ] 
