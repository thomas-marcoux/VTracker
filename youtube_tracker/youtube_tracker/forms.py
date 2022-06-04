from django import forms
from django.forms import ModelForm
from django.contrib.auth.forms import PasswordResetForm
from django.core.validators import ValidationError
from django.contrib.auth import password_validation
from .models import User


class LoginForm(forms.Form):
	email = forms.CharField(widget=forms.TextInput(
		{'id': 'email', 'class': 'input', 'placeholder': 'Email', 'type': 'email'}), max_length=254)
	password = forms.CharField(widget=forms.PasswordInput(
		attrs={'id': 'pass', 'class': 'input', 'data-type': 'password', 'type': 'password'}), max_length=128)


def LoginFormContext(_):
	return {'loginForm': LoginForm()}


class RegistrationForm(ModelForm):

	class Meta:
		model = User
		fields = ['email', 'password']
	email = forms.EmailField(widget=forms.EmailInput(
		{'id': 'email', 'class': 'input', 'type': 'email', 'placeholder': 'example@gmail.com'}), max_length=254)
	password = forms.CharField(widget=forms.PasswordInput(
		attrs={'id': 'pass', 'class': 'input', 'data-type': 'password', 'type': 'password', 'placeholder': 'Must be between 8-20 characters', 'required': 'True'}), min_length=8, max_length=20)
	password2 = forms.CharField(widget=forms.PasswordInput(
		attrs={'id': 'pass', 'class': 'input', 'data-type': 'password', 'type': 'password', 'placeholder': 'Re-type password above', 'required': 'True'}), min_length=8, max_length=20)

	def clean_email(self):
		if User.objects.filter(email=self.cleaned_data['email']).exists():
			raise ValidationError('This email has already been registered.')
		return self.cleaned_data['email']

	def clean(self):
		pass1 = self.cleaned_data['password']
		pass2 = self.cleaned_data['password2']
		if pass1 != pass2:
			raise ValidationError({'password2': ['Password mismatch!']})
		if pass1:
			try:
				password_validation.validate_password(pass1)
			except forms.ValidationError as error:
				self.add_error('password2', error)

	def save(self, commit=True):
		data = self.cleaned_data
		user = User.objects.create_user(email=data['email'], password=data['password'])
		return user


class PasswordEmailResetForm(PasswordResetForm):
	email = forms.EmailField(widget=forms.EmailInput(
		{'id': 'email', 'class': 'input', 'type': 'email', 'placeholder': 'example@gmail.com'}), max_length=254)
