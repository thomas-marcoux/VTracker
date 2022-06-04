"""
Utilities shared between views and used to fetch or transform values.

"""

# General imports
import collections
import datetime
from langdetect import detect
import operator
import pytz


def abbreviateNumber(number):
    """Abbreviate number to the closest magnitude."""
    num = float('{:.3g}'.format(number))
    magnitude = 0
    while abs(num) >= 1000:
        magnitude += 1
        num /= 1000.0
    return '{}{}'.format('{:f}'.format(num).rstrip('0').rstrip('.'), ['', 'K', 'M', 'B', 'T'][magnitude])


def convertToDate(date_string, date_format="%Y-%m-%d"):
    """Convert a string to a datetime object."""
    return datetime.datetime.strptime(date_string, date_format).replace(tzinfo=pytz.utc)


def detectLanguage(string):
    """Return language detected from given string."""
    try:
        post_lang = detect(string)
    except Exception:
        post_lang = 'UNK'
    return post_lang


def elasticSearchHitToDict(k, v):
    """Builds common dictionary from ElasticSearch hit."""
    return {'date': k.key_as_string, 'value': v.value, 'group': None}


def elasticSearchResponseToInteger(r):
    """Converts ElasticSearch hit to integer. Defaults to 0."""
    return int(r.value) if r.value else 0


def getIntervalFormat(interval):
    """Get date format from interval string. Defaults to year."""
    if interval == 'day':
        return 'YYYY-MM-dd'
    elif interval == 'week':
        return 'YYYY-MM-dd'
    elif interval == 'month':
        return 'YYYY-MM'
    else:
        return 'YYYY'


def getLatestEntry(items, attribute, offset=None):
    """Used to identify the last published or created video or channel from a list of items. Returns today's date by default. If provided, the date can be offset in order to show growth past the creation date."""
    latest_entry = datetime.datetime.now()
    if items and len(items) > 0:
        latest_entry = max(item[attribute] for item in items)
        if offset:
            latest_entry += offset
    return latest_entry


def getMaxDictKey(dictionary):
    """Return the key with the highest value in given dictionary."""
    dict_key_max = None
    try:
        dict_key_max = max(dictionary.items(), key=operator.itemgetter(1))[0]
    except (TypeError, ValueError):
        pass
    return dict_key_max


def getPOSTDateArgument(request, argument_name):
    """Converts POST parameter to datetime object."""
    return convertToDate(request.POST.get(argument_name)) if argument_name in request.POST else None


def getRequestTimeParameters(request):
    """Fetches common time parameters from POST request."""
    interval = request.POST.get('interval') if 'interval' in request.POST else None
    if interval == 'week':
        interval = '1w'
    return {
        'start_date': getPOSTDateArgument(request, 'rangeStartDate'),
        'end_date': getPOSTDateArgument(request, 'rangeEndDate'),
        'interval_format': getIntervalFormat(interval) if interval else None,
        'interval': interval,
    }


def handleBooleanParameter(request, arg, data):
    """If the argument is a boolean string, update data object with True or False."""
    value = request.POST.get(arg)
    true_keys = ['true', '1', 'yes']
    false_keys = ['false', '0', 'no']
    bool_keys = true_keys + false_keys
    if value.lower() in bool_keys:
        data[arg] = value.lower() in true_keys


def handleListParameter(request, arg, data):
    """If the argument is a list string, update data object with the list values."""
    if '[]' in arg:
        data[arg] = request.POST.getlist(arg)


def handleIntegerParameter(request, arg, data):
    """If the argument is an integer, update data object with the int value."""
    try:
        data[arg] = int(request.POST.get(arg))
    except ValueError:
        pass


def parseRequest(request):
    """Transform arguments in request object into proper types (boolean, list, date)."""
    data = {}
    for arg in request.POST:
        handleBooleanParameter(request, arg, data)
        handleIntegerParameter(request, arg, data)
        handleListParameter(request, arg, data)
        if arg not in data:
            data[arg] = request.POST.get(arg)
    data.update(getRequestTimeParameters(request))
    return data


def getTimeInSeconds(time_val):
    """Convert time to secs"""
    hours, minutes, secs = time_val.split(':')
    return int(hours) * 3600 + int(minutes) * 60 + int(secs)


def dictionaryMerge(dct, merge_dct):
    """ Recursively merge nested dictionaries. """
    for k, _ in merge_dct.items():
        if (k in dct and isinstance(dct[k], dict)
                and isinstance(merge_dct[k], collections.Mapping)):
            dictionaryMerge(dct[k], merge_dct[k])
        else:
            dct[k] = merge_dct[k]
