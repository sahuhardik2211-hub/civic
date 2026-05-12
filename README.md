# Municipal Corporation System — Deploy Ready

## Run Locally
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r ../requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```
Open `http://127.0.0.1:8000/`.

The Django backend serves the frontend at `/`, and the frontend calls the API
from the same host at `/api`. You can still open `frontend/index.html`
directly during development if the backend is running on `127.0.0.1:8000`.

## APIs
- GET `/api/dashboard`
- GET `/api/reports`
- POST `/api/reports/create`
- GET/PUT/DELETE `/api/reports/{id}`
- GET `/api/reports/status/{status}`
- GET `/api/reports/priority/{priority}`
- PUT `/api/reports/{report_id}/assign/{admin_id}`
- GET/POST `/api/citizens`, `/api/citizens/create`
- GET/POST `/api/admins`, `/api/admins/create`

## Sample Data
Run `python manage.py seed_data` then use:
- Admin ID: `A001`
- Citizen ID: `C001`
- Report ID: `R001`

## Deploy
Use `gunicorn municipal_project.wsgi` from backend directory. Set `DEBUG=False`, `SECRET_KEY`, and `ALLOWED_HOSTS` in production.
