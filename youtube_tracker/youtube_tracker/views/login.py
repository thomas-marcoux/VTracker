"""
Views for login and password reset.

"""

# Django imports
from django.contrib import messages
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.core.exceptions import ObjectDoesNotExist

# Sub packages
from ..forms import LoginForm, PasswordEmailResetForm
from youtube_tracker.models import User
from .registration import registrationSendEmail

# General imports
import logging
import os
from pathlib import Path

# Oauth2 imports
import google_auth_oauthlib.flow
from google.auth.transport.requests import Request
from oauth2client.client import AccessTokenCredentials
from youtube_tracker.settings import OAUTH2_CALLBACK_URI

logger = logging.getLogger(__name__)


def login_view(request):
    """Render the login page if user is not logged in. If the requests contains POST data, log in and redirect to the home page. """
    if request.method == 'POST':
        form = LoginForm(request.POST)
        if form.is_valid():
            data = form.cleaned_data
            user = authenticate(username=data['email'], password=data['password'])
            if user is not None:
                login(request, user)
                return redirect('homePage')
            if user is None:
                messages.error(request, 'Incorrect username or password')
    else:
        form = LoginForm()
    return render(request, 'registration/login.html', {'form': form})


def logout_view(request):
    """Logout user and redirects to the landing page."""
    logout(request)
    try:
        if request.session['oauth_credentials']:
            del request.session['oauth_credentials']
    except KeyError:
        pass
    return redirect('getLandingPage')


def forgot(request):
    """Render forgotten password form. If the requests contains POST data, send forgotten password email and render confirmation page."""
    if request.method == 'POST':
        form = PasswordEmailResetForm(request.POST)
        if form.is_valid():
            form.save(request=request)  # The save method will send the email
            return render(request, 'registration/password_reset_done.html')
    else:
        form = PasswordEmailResetForm()
    return render(request, 'registration/password_forgot.html', {'form': form})


def googleLogin(request):
    """Check if a User has Google OAuth Credentials. Initiate the OAuth Flow if there are no credentials or refresh the token if expired."""
    if request.user.is_authenticated:
        return redirect('homePage')
    credentials = AccessTokenCredentials(request.session.get('oauth_access_token'), 'user-agent-value') \
        if request.session.get('oauth_access_token') else None
    if not credentials or credentials.invalid:
        if credentials and credentials.access_token_expired and credentials.refresh_token:
            credentials.refresh(Request())
        else:
            return redirect(initiateOAuth2Flow(request))
    return redirect('homePage')


def initiateOAuth2Flow(request):
    """Initiate Google Authentication flow, define authorization scopes and redirect URL, then return the Google authorization url."""
    flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(os.path.join(Path(__file__).resolve().parent.parent,
                                                                  'oauth2_app_client_secret.json'),
                                                     scopes=['https://www.googleapis.com/auth/userinfo.email',
                                                             'openid',
                                                             'https://www.googleapis.com/auth/youtube.readonly'])
    flow.redirect_uri = OAUTH2_CALLBACK_URI
    authorization_url, state = flow.authorization_url(access_type='offline', include_granted_scopes='true')
    return authorization_url


def oAuth2Callback(request):
    """Listen for and verify the response from Google authorization server, exchange authorization code for an access token. Then return user profile as a json object."""
    try:
        state = request.GET.get('state')
        flow = google_auth_oauthlib.flow.Flow.from_client_secrets_file(
            os.path.join(Path(__file__).resolve().parent.parent,
                         'oauth2_app_client_secret.json'),
            scopes=['https://www.googleapis.com/auth/userinfo.email',
                    'openid',
                    'https://www.googleapis.com/auth/youtube.readonly'], state=state)
        flow.redirect_uri = OAUTH2_CALLBACK_URI
        # current_url = request.build_absolute_uri()  # Used for Testing
        # authorization_response = 'https:' + current_url.split(':')[1]  # Used for Testing
        authorization_response = request.build_absolute_uri()  # Used in Production
        flow.fetch_token(authorization_response=authorization_response)
        credentials = flow.credentials
        request.session['oauth_access_token'] = credentials.token
        request.session.modified = True
        oauth_session = flow.authorized_session()
        profile_info = oauth_session.get('https://openidconnect.googleapis.com/v1/userinfo').json()
        return completeOAuthFlow(request, profile_info)
    except Exception as e:
        logger.error("Error:{0}".format(e.args[0]))
        return redirect('login')


def completeOAuthFlow(request, profile_info):
    """Login a Google user using their email if they exist in the database. Register the user if they don't exist"""
    user_profile = profile_info
    if not user_profile:
        return redirect('login')
    user_email = user_profile['email']
    try:
        user = User.objects.get(email=user_email)
    except ObjectDoesNotExist:
        user = None
    if not user:
        user = User.objects.create_user(email=user_email, google_user=True)
        login(request, user)
        return registrationSendEmail(request, user)
    login(request, user)
    return redirect('homePage')