from sqlalchemy.orm import Session
from auth import models, database, security

def create_initial_user():
    db = database.SessionLocal()
    try:
        # Check if user exists
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if user:
            print("User 'admin' already exists.")
            return

        # Create admin user
        hashed_password = security.get_password_hash("admin123")
        db_user = models.User(username="admin", hashed_password=hashed_password, role="admin")
        db.add(db_user)
        db.commit()
        print("User 'admin' created successfully with password 'admin123'.")
    except Exception as e:
        print(f"Error creating user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    # Ensure tables exist
    models.Base.metadata.create_all(bind=database.engine)
    create_initial_user()
