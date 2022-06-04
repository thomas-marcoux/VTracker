"""
Custom Decorators for view functions
"""

# Django imports
from django.core.exceptions import PermissionDenied

# General imports
import time
import logging


logger = logging.getLogger(__name__)


def ajax_post_required(f):
    """
    Control that a user is logged in, request is AJAX and the request uses the POST method
    """

    def ajax_post_wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.is_ajax() or not request.method == 'POST':
            raise PermissionDenied
        return f(request, *args, **kwargs)

    ajax_post_wrapper.__doc__ = f.__doc__
    ajax_post_wrapper.__name__ = f.__name__
    return ajax_post_wrapper


def ajax_get_required(f):
    """
    Control that a user is logged in, request is AJAX and the request uses the GET method
    """

    def ajax_get_wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated or not request.is_ajax() or not request.method == 'GET':
            raise PermissionDenied
        return f(request, *args, **kwargs)

    ajax_get_wrapper.__doc___ = f.__doc__
    ajax_get_wrapper.__name__ = f.__name__
    return ajax_get_wrapper


def timeit(method):
    """
    Return the time it takes for a view function to execute
    """

    def timed(*args, **kwargs):
        start_time = time.time()
        result = method(*args, **kwargs)
        end_time = time.time()
        logger.info('%r (%r, %r) %2.2f sec' % (method.__name__, args, kwargs, end_time - start_time))
        return result

    return timed
