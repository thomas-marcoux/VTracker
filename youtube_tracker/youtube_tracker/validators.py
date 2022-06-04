"""Describes custom validators as per https://docs.djangoproject.com/en/3.2/topics/auth/passwords/."""

from django.core.exceptions import ValidationError


class CustomPasswordValidator:

    def __init__(self):
        self.error_msg = "Password must contain at least 1 digit and 1 letter."
    
    def validate(self, password, user=None):
        if not any(char.isdigit() for char in password):
            raise ValidationError(self.error_msg)
        if not any(char.isalpha() for char in password):
            raise ValidationError(self.error_msg)
        
    def get_help_text(self):
        return self.error_msg


class MaxPasswordLength:

    def __init__(self, max_length=128):
        self.max_length = max_length
        self.error_msg = f"Password length can't exceed {self.max_length}."

    def validate(self, password, user=None):
        if len(password) > self.max_length:
            raise ValidationError(self.error_msg)

    def get_help_text(self):
        return self.error_msg
