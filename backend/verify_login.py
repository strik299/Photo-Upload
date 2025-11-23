from auth import models, database, security
from sqlalchemy.orm import Session

def verify_user():
    db = database.SessionLocal()
    try:
        user = db.query(models.User).filter(models.User.username == "admin").first()
        if not user:
            print("User 'admin' NOT FOUND in database.")
            return

        print(f"User 'admin' found. Role: {user.role}")
        
        if security.verify_password("admin123", user.hashed_password):
            print("Password 'admin123' VERIFIED successfully.")
        else:
            print("Password 'admin123' FAILED verification.")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    verify_user()
