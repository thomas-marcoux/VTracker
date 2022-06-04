# VTracker

See the latest changes [here](CHANGELOG.md).

## Project Overview

Below is the directory structure as it appears in this repository and is given as information only, there should be no need for contributors to edit anything at this level.

![Project Structure](/readme_assets/VTrackerProjectStructure.png)

* Core Django Files include `manage.py` and `setup.py` and are used to run the app.


## Development Structure
![Development Structure](/readme_assets/VTrackerDevelopmentStructure.png)

Core Django Files include the following:
* `forms.py` - Defines login and registration forms. See the official [forms documentation](https://docs.djangoproject.com/en/3.2/topics/forms//) for more information.
* `local_settings.py` - Contains security information and path settins such as database information. Get this file from the [vTracker Documentation Folder](https://drive.google.com/drive/u/0/folders/1pjs9AQvWIkvDCmB6YPhcjbxJJWIxiiWi)
* `models.py` - Defines models describing the VTracker database. See  the official [models documentation](https://docs.djangoproject.com/en/3.2/topics/db/models/) for more information.
* `settings.py` - Defines project settings such as installed apps, debugging settings, etc. See the official [settings documentation](https://docs.djangoproject.com/en/3.2/topics/settings/)for more information.
* `urls.py` - Defines Django URL pathing and dispatching. See the official [urls documentation](https://docs.djangoproject.com/en/3.2/topics/http/urls/) for more information and [this section](#python-naming-conventions) for project best practices.
* `validators.py` - Defines form validators for certain fields. See the official [validators documentation](https://docs.djangoproject.com/en/3.2/ref/validators/) for more information.
* `wsgi.py` - Web Server Gateway Interface configuration file. Used for deployment and virtual environment.


## How to run for the first time

1. Install Anaconda3 Windows 64 bit Python 3.7. When asked, choose to add Anaconda to PATH or finish the installation and run " echo %PATH%" in the Anaconda console, then add the values found there to your Windows environment PATH.
2. [Create virtual environment](https://programwithus.com/learn-to-code/Pip-and-virtualenv-on-Windows/)
3. Run 
```console
pip install -r requirements.txt
```
4. Add virtualenv info to wsgi file. On windows, add these lines:
```python
activate_this = "C:/Users/<User>/Envs/my_application/Scripts/activate_this.py"
exec(open(activate_this).read(), dict(__file__=activate_this))
```
5. Check out the [main repository](https://github.com/COSMOS-UALR/YouTubeTracker). Make sure all contributions are made to the **Dev branch**. You should make no commits to the *Release* and *master* branches.
6. Get `local_settings.py` from the [vTracker Documentation Folder](https://drive.google.com/drive/u/0/folders/1pjs9AQvWIkvDCmB6YPhcjbxJJWIxiiWi)


For version control, you are free to use the tool of your choice to interface with github (github desktop, git kraken, IDE integration, …)but make sure to use ClickUp codes as described [here](https://docs.clickup.com/en/articles/856285-github) when making commits. For example: `CU-1860bab Fixed analytics bug`.

### DataBase Setup:

Ask a senior developer to help you with DB login credentials. You will be given a personal account. Once you have it, edit your youtube_tracker local_settings.py file like so:

```python
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'youtube_tracker',
        'USER': <your mysql username>,
        'PASSWORD':<your mysql password>,
        'HOST': 'localhost',   
        'PORT': '3306',
        'OPTIONS': {
            'charset': 'utf8mb4',
            'use_unicode': True, },
    }
}
```
Be careful not to track and commit this file or your account information will be revealed.

See [how to create a connection so you can access the DB directly.](https://dev.mysql.com/doc/workbench/en/wb-mysql-connections-new.html)

### Last note
Parts of the project use OpenCV, therefore you may need to install [this Windows feature pack](https://www.microsoft.com/en-us/software-download/mediafeaturepack) only do so if you are unable to run the project. Check your Windows version and choose the package accordingly.

## IDE Setup

### PyCharm Setup (Recommended):

[Configure a virtual environment](https://www.jetbrains.com/help/pycharm/creating-virtual-environment.html)

Make sure to use the professional version (available by registering with your student account). This will allow you to enable [Django Support](https://www.jetbrains.com/help/pycharm/django-support7.html) and [Configure the project structure](https://www.jetbrains.com/help/pycharm/configuring-project-structure.html) as below

![PyCharm Project Structure](/readme_assets/PyCharmProjectStructure.png)

### Visual Studio Code References:

[Create a debugger launch profile for your Django project.](https://code.visualstudio.com/docs/python/tutorial-django#_create-a-debugger-launch-profile)

[Djaneiro - Django Snippets](https://marketplace.visualstudio.com/items?itemName=thebarkman.vscode-djaneiro)



## Code Conventions

### Python Naming Conventions

| Type | Case |
| --- | --- |
| Methods | lowerCamelCase |
| Classes | UpperCamelCase |
| Constants | UPPER_SNAKE_CASE |
| Variables | lower_snake_case |
| File | lowerCamelCase* |

*For **html files** , use a combination of snake_case if the file is part of a larger template, e.g.

`myFile.html` exists by itself, while `myFile_itemCard.html` cannot be rendered by itself but belongs within myFile. Examples of this are: `home.html` and `home_card.html`.

**Never** use arbitrary acronyms or contractions when naming. Spell things out as much as possible. Half spelling for methods and subsequent variables can be fine **if it is spelled out in the documentation**. E.g. getVideo**Desc** and video_**desc** when working with video descriptions.

For **Render Methods,** if a path is defined, all arguments should have the same name; e.g.

```python
path('contentAnalysisCategory', views.contentAnalysisCategory, name='contentAnalysisCategory')
```

The first argument of the path is how it will appear in the address bar and how the function can be called from another page. The name argument is used to perform URL reversing within the backend, i.e. it is a pythonic way to obtain the page's URL as opposed to using a Django template in the front end. See [Path Documentation](https://docs.djangoproject.com/en/3.2/ref/urls/).

### Python Styling and Best Practices

Whether you choose to use VS Code or PyCharm, both default format providers adhere to PEP8 rules and use pylint. Refer to the appropriate official documentation:

[Reformat and rearrange code | PyCharm](https://www.jetbrains.com/help/pycharm/reformat-and-rearrange-code.html)

[Linting Python in Visual Studio Code](https://code.visualstudio.com/docs/python/linting)

[Basic Editing in Visual Studio Code](https://code.visualstudio.com/docs/editor/codebasics#_formatting)

When in doubt, refer to [styleguide | Style guides for Google-originated open-source projects](https://google.github.io/styleguide/pyguide.html)

### Python Size limits

1. Character Limit - Default PEP8 limit (except for docstrings)
2. Line Limit (per function): **35** lines

One common case is where a function becomes increasingly nested and individual values need to be retrieved from a dictionary. If that is the case, create a clearly named and documented utility function.

1. Line Limit (per file): ~(**300** lines / 15 functions)

Files should be kept as short as possible. If adding code makes a file become too large, discuss with a senior dev to create a new one prefixed with the parent file's name followed by its function. I.e., if I need to expand behaviors in video.py I would create a file called `video_myBehavior.py`.

### Other guidelines

1. Back-end guideline

The back-end should be used 90% for querying the database. There should be as little behavior as possible that can be done in the front end (e.g., calculating time, data operations doable in the front)

2. File rules

As per PEP8 conventions, files should have two lines between each function and end in an empty line. There should be no empty lines within a function. If the function appears cluttered, create a sub-method instead of inserting a line break.

3. Imports

Avoid using
 ```python
from file import *
```
 Rather, use
 ```python
 from file import MyClass, myFunction
 ```
 This way it is easier to know what files use each other and whether to merge any of them.

4. Comments

Besides docstrings (see below) there should be no comments within a method. If a behavior needs commenting for its use to be clear, export it to a function instead and describe it there. One exception being the use of scientific libraries such as numpy. Should particular lines need temporary disabling, add the reason why in parentheses, e.g.

```python
# (Takes too long to respond) myVariable = myLengthyCall()
```

5. Exception handling

Only use try blocks if the exception is identified and handled (if it is unclear how the exception should be handled, report to a senior dev). There should be no catch blocks simply printing the error or passing. This way, bugs will be noticed more easily.

### Documentation

Each method should be documented with a simple triple quoted description. For most pages, functions will fit into one of each category:

1. Render - The page's HTML render. Renders take in a Web request and return a Web response, typically there is only one per file.
2. AJAX Calls - Asynchronously called from the above render's page to query the data layer and typically return a JsonResponse. As much as possible, indicate where in the page the AJAX is used.
3. Utility Functions - All remaining methods that typically support the above 2. They usually return native Python types. Indicate what function(s) the method supports.

To generate the documentation, you must install pycco. **Note the command has to be ran from a UNIX-like shell like Git Bash** it will not work from within the VSCode terminal.

Run the command **from within the app's root directory**. That is, the view's parent directory: `~/YouTubeTracker/youtube_tracker/youtube_tracker`. You should overwrite the existing doc files without new additions:

```console
pycco -pi views/*.py
```

See existing python files for reference and existing doc for what they should look like.

[This guide](https://realpython.com/generating-code-documentation-with-pycco/) was used as reference but the above instructions take priority.

### Javascript Styling and Best Practices

For formatting, [Prettier](https://prettier.io/) is recommended (available for both [VSCode](https://github.com/prettier/prettier-vscode) and [PyCharm](https://www.jetbrains.com/help/pycharm/prettier.html))

For quick reference, use [Mozilla's guidelines](https://developer.mozilla.org/en-US/docs/MDN/Guidelines/Code_guidelines/JavaScript). For anything more in depth, refer to [Google's guidelines](https://google.github.io/styleguide/jsguide.html).

### Javascript Naming Conventions

| Type | Case |
| --- | --- |
| Methods | lowerCamelCase |
| Classes | UpperCamelCase |
| Constants | UPPER\_SNAKE\_CASE |
| Variables | lowerCamelCase |
| File | lowerCamelCase |

### Javascript Size limits

1. Character Limit - **85** (except for docstrings)
2. Line Limit (per method): **35** lines (except method whose only function is defining a length dictionary)
3. Line Limit (per file): ~(**300** lines / 15 functions)

Files should be kept as short as possible. If adding code makes a file become too large, discuss with a senior dev about creating a new one.

### Javascript Documentation

We use [JSDoc](https://jsdoc.app/) for documentation, see how other files implement documentation (so far, only the ones within the charts subfolder) for quick reference or check [Google's JSDoc reference](https://google.github.io/styleguide/jsguide.html#jsdoc).

To generate documentation:

From the most inner 'youtube_tracker' folder (docs and static directories must be in the same folder), run 
```console
jsdoc -c .\docs\jsdoc.conf.json
```




## Deployment Instructions for Production on Ubuntu

### VM Configuration

Make sure the VMs have the following MAC addresses:

For LIVE version:

VM MAC Address 00:15:5D:22:F4:08

This MAC address is bound to the IP 144.167.35.128 at UALR. This will redirect to the domain name: [vtracker.host.ualr.edu](https://vtracker.host.ualr.edu/)

For DEMO version: (currently using as dev version with dynamic IP)

~~MAC Address 00:15:5D:22:F4:02~~

~~This MAC address is bound to the IP 144.167.35.104 at UALR. This will redirect to the domain name:~~ [~~youtubetracker.demo.host.ualr.edu~~](http://youtubetracker.demo.host.ualr.edu/)

If needed, see documentation below to set a static MAC address for a Hyper-V VM.

[Hyper-V: Change the MAC Address of a Virtual Machine](https://rdr-it.com/en/hyper-v-change-the-mac-address-of-a-virtual-machine/)

### Apache Setup

| **Run:** |
| --- |
```console
sudo apt-get install libmysqlclient-dev mysql-server
sudo service mysql start
```

`sudo apt autoremove` to remove.

### App Deployment

Create a root YouTubeTracker directory and checkout the latest Master branch from Github inside:

[https://github.com/COSMOS-UALR/YouTubeTracker](https://github.com/COSMOS-UALR/YouTubeTracker)

**IMPORTANT**

1. Make sure the IPs and domain names are added to the list of ALLOWED\_HOSTS in the YouTubeTracker settings file.
2. Make sure the `settings.py` file points to the current (local) Live Database.

### Virtual Environment

| **Run:** |
| --- |
```console
sudo apt-get install virtualenv
<In root YTT folder>
python3 -m venv Env
source Env/bin/activate
```

Create a virtualenv environment (preferably inside the YouTubeTracker folder created earlier) and activate it with
```console
source <virtual environment path>/bin/activate.
```

Use the "deactivate" command to exit the environment.

Reference:

- [Installing packages using pip and virtual environments](https://packaging.python.org/guides/installing-using-pip-and-virtual-environments/)

Install dependencies from YouTubeTracker's requirements.txt

| **Run:** |
| --- |
```console
pip install -r requirements.txt
python3 manage.py makemigrations
```

### Apache configuration

Copy conf file [here](https://drive.google.com/open?id=17UWgRfclRgErl46xlfIWX-5ioxaWGsMp) to `/etc/apache2/sites-available/000-default.conf`.

Update top variables with correct domain name, ip, paths, etc.

| **Explanation:** |
| --- |
```apacheconf
<VirtualHost <VM IP>>
ServerName <website name>
ServerAlias <website name>
ErrorLog <Desired location for error log file>
CustomLog <Desired location for access log file> combined
WSGIDaemonProcess dev processes=2 threads=12 python-path=<path to folder containing manage.py> python-home=<path to virtual environment folder>
WSGIProcessGroup dev
WSGIScriptAlias / <path to wsgi.py>

<Directory <path to folder containing wsgi.py>>
       <Files wsgi.py>
       Require all granted
       </Files>
</Directory>

Alias /static/<app> <path to the app’s static folder>
<Directory <path to the app’s static folder>>
       Require all granted
</Directory>
```

References:

- [How To Serve Django Applications with Apache and mod\_wsgi on Ubuntu 14.04](https://www.digitalocean.com/community/tutorials/how-to-serve-django-applications-with-apache-and-mod_wsgi-on-ubuntu-14-04)
- [Hosting Django sites with Apache](https://www.metaltoad.com/blog/hosting-django-sites-apache)
- [How to use Django with Apache and mod\_wsgi](https://docs.djangoproject.com/en/2.2/howto/deployment/wsgi/modwsgi/)
- [Quick Install of Apache, WSGI, and Django on Ubuntu Linux 18.04](https://mindchasers.com/dev/apache-install)

Install SSL Certificate - [Manually install an SSL certificate on my Apache server (Ubuntu) | SSL Certificates](https://www.godaddy.com/help/manually-install-an-ssl-certificate-on-my-apache-server-ubuntu-32078)

Append following configuration to /etc/apache2/apache2.conf

| **Configuration:** |
| --- |
* Reduces response time for WSGI applicationsWSGIApplication %{GLOBAL}
* STILL NEEDS TESTING - skip this for now: LoadModule headers\_module modules/mod\_headers.so
* Allows pages to query outside ressource
Headers set Access-Control-Allow-Origin "*"

Restart server:
```console
sudo /etc/init.d/apache2 restart
```

Access at [http://144.167.35.104/](http://144.167.35.104/)

### Misc/Troubleshooting

- The following changes were made to remedy request timeouts: Appended "WSGIApplicationGroup %{GLOBAL}" to /etc/apache2/apache2.conf. ( [WSGI : Truncated or oversized response headers received from daemon process](https://serverfault.com/questions/844761/wsgi-truncated-or-oversized-response-headers-received-from-daemon-process) )


## ElasticSearch Installation


### ELK Stack Basic Configuration


To install the ELK stack, [this guide](https://websiteforstudents.com/how-to-install-elk-stack-on-ubuntu/) was followed for general setup, with some changes:

* To access ES and Kibana outside of localhost, set their network hosts values to 0.0.0.0 (see [this](https://github.com/wazuh/wazuh-kibana-app/issues/1683) and [this](https://discuss.elastic.co/t/what-is-network-host/274426/2)).

* Edit logstash jvm.options to increase JVM RAM paramter to 6 as is recommended in the [documentation](https://www.elastic.co/guide/en/logstash/current/jvm-settings.html#heap-size).

* Because this is a single-cluster system, the following needs to be enabled as per [this issue](https://stackoverflow.com/a/61547317).
```apacheconf
discovery.type: single-node
```
On a single cluster, it is [best practice](https://discuss.elastic.co/t/setting-up-a-multi-nodes-cluster-on-a-single-machine-1-elasticsearch-yml-file/272286/3) not to use multiple nodes.

After following that simple guide, everything should run. Note that, since ELK is NoSQL, there is no need to define the indexes. They will be created automatically when Logstash populates them.

### ELK Stack X-Pack Configuration

In this step, we activate security features and monitoring.

1. [Setup basic security](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-basic-setup.html#generate-certificates) (only the linked section)
2. [Encrypt HTTP client communications for Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-basic-setup-https.html#encrypt-http-communication)
    * For all further steps, mentions of elasticsearch.hosts must be edited to use https.
3. For all certificate files copied, update permissions so group owners can read and write.
4. [Configure Security in Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/7.5/configuring-security.html)
5. [Configure Security in Kibana](https://www.elastic.co/guide/en/kibana/7.5/using-kibana-with-security.html)
    * To access Kibana outside of localhost with xpack security, uncomment kibana user/pwd and the below settings (from [this post](https://discuss.elastic.co/t/kibana-unable-to-connect-elastic-search-using-x-pack/201050) - other security features can be ignored.)
    ```apacheconf
    server.host: <IP>
    server.ssl.enabled: false
    elasticsearch.ssl.certificateAuthorities: <absolute path to certificate>
    #Certificates is the pem key generated in this step
    ```
6. Update all config files to add (or uncomment for Logstash) the x-pack parameters from [this excellent post](https://www.zylk.net/en/web-2-0/blog/-/blogs/visualizing-logstash-pipelines-in-kibana?_com_liferay_blogs_web_portlet_BlogsPortlet_showOnlyIcons=true&scroll=_com_liferay_blogs_web_portlet_BlogsPortlet_discussionContainer)
    * Remember elasticsearch.hosts must use https.
    * Define `xpack.monitoring.elasticsearch.ssl.certificate_authority` as described 6-3 [here](https://www.elastic.co/blog/configuring-ssl-tls-and-https-to-secure-elasticsearch-kibana-beats-and-logstash#enable-ts-logstash) except we use the same pem file from earlier after copy and pasting to the logstash folder and updating rights so the logstash group owns it.
    * Setting `xpack.monitoring.elasticsearch.ssl.verification_mode` to `certificate` also seemed to help.
7. Update the existing Logstash conf files:
    * For output plugins, also update http to https, and set `cacert` to the logstash pem file path as described in the [documentation](https://www.elastic.co/guide/en/logstash/current/ls-security.html#es-sec-plugin), as well as `user`, `password`, and `ssl_certificate_verification` (set to `true`) as seen in [this issue](https://github.com/elastic/logstash/issues/10922).

[This](https://www.elastic.co/blog/elasticsearch-security-configure-tls-ssl-pki-authentication) touches up more on generating certificates and configuring some security features. Skip SSL encryption (set to false in the config) and PKI authentication parts as these are premium features.

### Logstash Data Ingestion Configuration

Now, following the above guidelines, configure conf files as needed to import VT data. [This guide](https://www.elastic.co/blog/how-to-keep-elasticsearch-synchronized-with-a-relational-database-using-logstash) was previously used for creating the basic jdbc configuration. Documentation for the jdbc input plugin can be found [here](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-jdbc.html), and documentation for the filter plugin [here](https://www.elastic.co/guide/en/logstash/8.0/plugins-filters-jdbc_static.html). [This](https://qbox.io/blog/migrating-mysql-data-into-elasticsearch-using-logstash) is another useful resource.

To handle large data volumes:

* While the documentation has a section on [dealing with large result sets](https://www.elastic.co/guide/en/logstash/current/plugins-inputs-jdbc.html#_dealing_with_large_result_sets) and documents the use of the `jdbc_fetch_size` parameter, use paging as described in [this issue](https://github.com/logstash-plugins/logstash-input-jdbc/issues/9). Setting `jdbc_paging_enabled` and `jdbc_page_size` will add a LIMIT and OFFSET to the SQL query, allowing for manageable query results. It is unclear what performances difference are, if any, by changing values of `jdbc_fetch_size`.
* When initializing the ElasticSearch client in the Django backend, max terms count had to be updated, see [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-terms-query.html) and [here](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules.html#index-max-terms-count).

Make sure folders Logstash will write to such as /var/logs/Logstash and /usr/share/logstash/data are also writeable by Logstash and set the [JVM tmp folder](https://github.com/elastic/logstash/issues/10714) to a [writeable location](https://www.thegeekdiary.com/unix-linux-what-is-the-correct-permission-of-tmp-and-vartmp-directories/).


### Future improvements

Configure [filebeat](https://www.elastic.co/guide/en/beats/filebeat/current/configuring-ssl-logstash.html) and Metricbeat [1](https://www.elastic.co/guide/en/beats/metricbeat/current/metricbeat-installation-configuration.html), [2](https://www.elastic.co/guide/en/beats/filebeat/current/monitoring-metricbeat-collection.html#configure-metricbeat), & [3](https://www.elastic.co/guide/en/elasticsearch/reference/8.0/configuring-metricbeat.html) for further monitoring and logging. Possibly refer to [the documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/security-basic-setup-https.html#configure-beats-security) for further x-pack configuration. [This guide](https://www.digitalocean.com/community/tutorials/how-to-install-elasticsearch-logstash-and-kibana-elastic-stack-on-ubuntu-20-04#step-4-installing-and-configuring-filebeat) also has further details on Filebeat setup.

&copy; COSMOS 2021
