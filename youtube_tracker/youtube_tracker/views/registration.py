"""
Views for user registration.

"""

# Django imports
from django.contrib.auth import get_user_model, login
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.contrib.sites.shortcuts import get_current_site
from django.http import Http404
from django.shortcuts import render, redirect
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.template.loader import render_to_string

# Sub packages
from ..forms import RegistrationForm


def registration(request):
    """Render registration page. If the requests contains POST data, register user and send confirmation email."""
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            user = form.save()
            return registrationSendEmail(request, user)
    else:
        form = RegistrationForm()
    return render(request, 'registration/registration.html', {'form': form})


def registrationSendEmail(request, user=None):
    """Render registration email confirmation page, register user, and send confirmation email."""
    user = user if user is not None else request.user
    if user.is_authenticated:
        current_site = get_current_site(request)
        subject = '[Vtracker] Verify your account.'
        message = render_to_string('registration/registration_email.html', {
            'user': user,
            'domain': current_site.domain,
            'uid': urlsafe_base64_encode(force_bytes(user.pk)),
            'token': default_token_generator.make_token(user),
        })
        user.email_user(subject, message)
        return render(request, 'registration/registration_sentEmail.html', {'user': user})
    raise Http404


def registrationActivate(request, uidb64, token):
    """Verify user's email and redirect to the home page."""
    try:
        uid = urlsafe_base64_decode(uidb64)
        user = get_user_model()._default_manager.get(pk=uid)
    except(TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    if user is not None and default_token_generator.check_token(user, token):
        user.is_active = True
        user.is_email_verified = True
        user.save()
        login(request, user)
        return redirect('homePage')
    else:
        return render(request, 'registration/registration_invalid.html')
