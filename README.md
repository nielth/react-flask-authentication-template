# React + Flask Application

A simple skeleton template for an application which contains a connected Flask backend (with Flask-JWT-Extended cookie authentication) to a react frontend. The backend uses sqlite to store non-volatile data. Everything runs in Docker with one container for the Flask API backend, and one Nginx container handling all the user interaction. The Nginx container parses the built React web content and handles reverse proxy to the Flask application.

The React application uses MUI lightweight CSS framework that follows Google's Material Design guidelines (to abstract frontend development). Routing is handled by react-router-dom (v6) fromework.

- Backend path requests must always start with `/api` for the reverse proxy to handle Flask requests.
- Variable `REACT_APP_API` is only set when developing.

## For developing
```
dc up --build api
REACT_APP_API="http://localhost:5000" yarn start
```
