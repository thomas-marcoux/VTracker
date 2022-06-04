from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.serializers.json import DjangoJSONEncoder
from django.http import HttpResponse

from ..forms import AddContentForm
from .lib import contentIsURL, splitInput, splitKeywords

# API Requirements
from urllib.parse import urlparse
from dateutil.parser import parse
import requests
import datetime
from io import BytesIO 
import pandas as pd
import pymysql
import re
import json
import csv
import logging
from tqdm import tqdm
import string 
import random

logger = logging.getLogger(__name__)
token = "fc7ea3a02234f4589f5042bfcf9d637f"

def get_article(urls):
    articles = []
    connection = get_connection()
    for url in tqdm(urls):
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM posts where url = %s;", url)
            record = cursor.fetchall()
            if record:
                articles.append(record[0])
            else:
                articles += diff_get_article(url)
    connection.close()
    return articles

def get_keyword(keywords, diff_bot=False, size=50):
    if diff_bot:
        return diff_get_keyword(keywords, size=size)
    else:
        terms = "+" + " +".join(keywords)
        connection = get_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT * FROM blogs.posts WHERE Match(content) against (%s IN BOOLEAN MODE) order by published_date desc limit %s;", (terms, size))
        connection.close()
        return cursor.fetchall()

def process_diff_data(diff_data):
    articles = []
    connection = get_connection()
    for data in tqdm(diff_data): 
        if 'pageUrl' in data:
            #Cleaning
            domain = urlparse(data['pageUrl']).netloc.replace("www.","")
            if 'date' in data:
                if 'timestamp' in data['date']:
                    try: 
                        published_date = datetime.datetime.fromtimestamp(data['date']['timestamp']/1000) 
                    except OSError:
                        published_date = None
                else: 
                    published_date = parse(data['date'])
            else: 
                published_date = None
            html_content = data['html'] if 'html' in data else None
            links = get_links(html_content) if html_content else None
            author = data['author'] if 'author' in data else None
            #adding to db
            if '<?xml' not in data['text']:
                sql_query = """INSERT INTO posts (domain, url, author, title, published_date, content, content_html, links) 
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s)"""
                sql_data = (domain, data['pageUrl'], author, data['title'], published_date, data['text'], html_content, links)
                try:
                    commit_to_db(sql_query, sql_data)
                except Exception as e:
                    print(e)
            #Formating for return
            if '<?xml' not in data['text']: articles.append({
                'domain': domain, 
                'url':data['pageUrl'],
                'author':author,
                'title':data['title'], 
                'title_sentiment':None,
                'title_toxicity':None,
                'published_date':published_date,
                'content':data['text'],
                'content_sentiment':None,
                'content_toxicity':None,
                'content_html':html_content,
                'language':None, 
                'links':links,
                'crawled_time':datetime.datetime.now()
            })
            #Checking for comments
            if 'discussion' in data:
                #Doing all non-nested comments first
                comment_data = sorted(data['discussion']['posts'], key=lambda k: ("parentId" in k, k.get("parentId", None)))
                for c in comment_data:
                    comment = {}
                    comment['domain'] = domain
                    comment['url'] = data['pageUrl']
                    comment['username'] = c['author'] if 'author' in c else None
                    comment['comment'] = c['text']
                    comment['comment_original'] = c['html'] 
                    comment['published_date'] = parse(c['date']) if 'date' in c else None
                    comment['links'] = get_links(c['html'])
                    comment['reply_count'] = len([x for x in comment_data if 'parentId' in x and c['id'] == x['parentId']])
                    parent_comment = [x for x in comment_data if 'parentId' in c and c['parentId'] == x['id']]
                    comment['reply_to'] = get_reply_to(parent_comment[0]) if parent_comment else None
                    insert_comment(comment)

                    #Formating for return
            if '<?xml' not in data['text']: articles.append({
                'domain': domain, 
                'url':data['pageUrl'],
                'author':author,
                'title':data['title'], 
                'title_sentiment':None,
                'title_toxicity':None,
                'published_date':published_date,
                'content':data['text'],
                'content_sentiment':None,
                'content_toxicity':None,
                'content_html':html_content,
                'language':None, 
                'links':links,
                'crawled_time':datetime.datetime.now()
            })
    connection.close()
    return articles


def get_reply_to(parent_comment):
    username = parent_comment['author'] if 'author' in parent_comment else None 
    connection = get_connection()
    with connection.cursor() as cursor:
        cursor.execute('''Select comment_id from comments where
                         url=%s and username=%s and comment_original=%s ''', 
                         (parent_comment['pageUrl'], username, parent_comment['html']))
        record = cursor.fetchall()
    return record[0]['comment_id']


def insert_comment(comment):
    """Checks if the comment is already in database, then updates. 
        If not, generate unique key and update"""
    #Getitng id
    connection = get_connection()
    with connection.cursor() as cursor:
        cursor.execute('''Select comment_id from comments where
                         url=%s and username=%s and published_date=%s ''', 
                         (comment['url'], comment['username'], comment['published_date']))
        record = cursor.fetchall()
        c_id = record[0]['comment_id'] if record else gen_comment_id()
    connection.close()
    #Adding to database
    sql_query = """INSERT INTO comments (domain, url, comment_id, username, comment, 
                    comment_original, links, published_date, reply_count, reply_to) 
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE domain=%s, username=%s, reply_count=%s,
                    crawled_time = CURRENT_TIMESTAMP()"""
    sql_data = (comment['domain'], comment['url'], c_id, comment['username'], 
                comment['comment'], comment['comment_original'], comment['links'],
                comment['published_date'], comment['reply_count'], comment['reply_to'],
                comment['domain'], comment['username'], comment['reply_count'])
    commit_to_db(sql_query, sql_data)


def gen_comment_id():
    return ''.join(random.choices(string.ascii_letters.lower() + string.digits, k=16))

def diff_get_keyword(search_terms, size=50, page_num=0):
    terms = []
    for term in search_terms:
        terms.append("text%3A%22{}%22%20".format(term))
    terms = "".join(terms)
    diff_endpoint = "https://kg.diffbot.com/kg/dql_endpoint?type=query&token={}&size={}&from={}&query=type%3AArticle%20{}".format(token, size, page_num, terms)
    request = requests.get(diff_endpoint).json()
    
    print("Number of pages: {}".format(request['hits']))
    diff_data = request['data']

    return process_diff_data(diff_data)

def diff_get_article(url):  
    diff_endpoint = "https://api.diffbot.com/v3/analyze?token={}&url={}".format(token, url)
    request = requests.get(diff_endpoint).json()
    if 'error' in request: 
        print("\n{} url: {}".format(request['error'], url))
        return []
    diff_data = request['objects']

    return process_diff_data(diff_data)

def links_to_json(links):
    if links: 
        df = {'links':links}
        return json.dumps(df)
    else:
        return None

def get_links(html):
    return links_to_json(re.findall(r'https?://[^\s<>"]+|www\.[^\s<>"]+',html.replace('};', '')))

def get_connection():
    connection = pymysql.connect(host='144.167.35.221',
                                user='diffbot',
                                password='Cosmos1',
                                db='blogs',
                                charset='utf8mb4',
                                use_unicode=True,
                                cursorclass=pymysql.cursors.DictCursor)
    return connection

def commit_to_db(query, data, error=0):
    # while True: 
    try:
        connection = get_connection()
        with connection.cursor() as cursor:
                cursor.execute(query, data)
                connection.commit()
                connection.close()
                return 
    #Error handeling
    except Exception as e:
        if isinstance(e, pymysql.err.IntegrityError) and e.args[0]==1062:
            # Duplicate Entry, already in DB
            if 'INTO posts' in query:
                pass #Duplicate posts will happen, they don't need to be udpated
            else: 
                print("There is already duplicate entry in the DB, check the quary: {}".format(query))
            connection.close() 
            return
        elif e.args[0] == 1406:
            # Data too long for column
            print(e)
            print("Good API request, but data is Too Long for DB Column")
            connection.close()
            return 
        elif e.args[0] == 2013:
            if error < 10:
                commit_to_db(query, data, error+1)
                connection.close()
            else:
                raise Exception("Keep loosing connection to the db: {}".format(e))
        else: 
            # Uncaught errors
            raise Exception("We aren't catching this mySql commit_to_db Error: {}".format(e))

# Blog Crawler Page
@login_required(login_url='/YTAdminConsole/login/')
def addToBlogCrawler(request):
    error_log = []
    if request.method == 'POST':
        form = AddContentForm(request.POST)
        if form.is_valid():
            fileName = form.cleaned_data['run_name']
            output = None
            response = None
            if 'url_xlsx' in request.POST or 'url_json' in request.POST or 'url_db' in request.POST:
                urls = splitInput(form.cleaned_data['content_list'])
                data = get_article(urls)
            if 'keyword_xlsx' in request.POST or 'keyword_json' in request.POST or 'keyword_db' in request.POST:
                keywords = splitKeywords(form.cleaned_data['keyword_list'])
                data = get_keyword(keywords, diff_bot=form.cleaned_data['use_diffbot'], size=50)
            if 'url_json' in request.POST or 'keyword_json' in request.POST:
                output = json.dumps(data, cls=DjangoJSONEncoder)
                response = HttpResponse(output, content_type='application/json')
                response['Content-Disposition'] = 'attachment; filename=' + fileName + '.json'
            if 'url_xlsx' in request.POST or 'keyword_xlsx' in request.POST:
                df = pd.DataFrame(data)
                #Removing Timezones
                df['published_date'].dt.tz_localize(None)
                io = BytesIO()
                PandasWriter = pd.ExcelWriter(io, engine='xlsxwriter')
                df.to_excel(PandasWriter, header=True, index=False, encoding='utf-8', na_rep='None', engine='xlsxwriter')
                PandasWriter.save()
                PandasWriter.close()
                io.seek(0)
                output = io.getvalue()
                response = HttpResponse(output, content_type="text/xlsx")
                response['Content-Disposition'] = 'attachment; filename=' + fileName + '.xlsx'
            messages.success(request, "Content has been successfully added to the crawler.")
            logger.info("YT Admin Page - content Page -- blogs crawled successfully")
            if response:
                return response
        else:
            messages.error(request, "An error occured while crawling the blogs.")
            logger.info("YT Admin Page - Error occured")
    # Clear the form
    form = AddContentForm()
    return render(request, 'YTAdminConsole/addToBlogCrawler.html',
        {'form': form, 'error_log': error_log})
