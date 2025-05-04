# Firecrawl Documentation For Change Tracking

```python
from firecrawl import FirecrawlApp
from dotenv import load_dotenv
import os
```

```python
base_url = "https://bullet-echo.fandom.com/wiki/Special:AllPages"

app = FirecrawlApp()
```

Change tracking enables you to:

* Detect if a webpage has changed since the last scrape
* View the specific changes between scrapes
* Get structured data about what has changed
* Control the visibility of changes

Using the `changeTracking` format, you can monitor changes on a website and receive information about:

* `previousScrapeAt`: The timestamp of the previous scrape that the current page is being compared against (null if no previous scrape)
* `changeStatus`: The result of the comparison between the two page versions
  * `new`: This page did not exist or was not discovered before (usually has a null `previousScrapeAt`)
  * `same`: This page's content has not changed since the last scrape
  * `changed`: This page's content has changed since the last scrape
  * `removed`: This page was removed since the last scrape
* `visibility`: The visibility of the current page/URL
  * `visible`: This page is visible, meaning that its URL was discovered through an organic route (through links on other visible pages or the sitemap)
  * `invisible`: This page is not visible, meaning it is still available on the web, but no longer discoverable via the sitemap or crawling the site. We can only identify invisible links if they had been visible, and captured, during a previous scrape or scan.

```python
# Check if it has been scraped
result = app.scrape_url(
    base_url,
    formats=["changeTracking", "markdown"],
)
```

```python
tracking_data = result.changeTracking

tracking_data
```

    ChangeTrackingData(previousScrapeAt='2025-05-03T15:47:57.21162+00:00', changeStatus='changed', visibility='visible', diff=None, json=None)

```python
about_page = "https://bullet-echo.fandom.com/wiki/About_Game"

result = app.scrape_url(
    about_page,
    formats=["changeTracking", "markdown"],
)

tracking_data = result.changeTracking
```

```python
tracking_data
```

    ChangeTrackingData(previousScrapeAt='2025-05-03T15:48:12.50282+00:00', changeStatus='changed', visibility='visible', diff=None, json=None)

```python
wc_page = "https://uz.wikipedia.org/wiki/Sumka"

result = app.scrape_url(
    wc_page,
    formats=["changeTracking", "markdown"],
)

tracking_data = result.changeTracking
tracking_data
```

    ChangeTrackingData(previousScrapeAt='2025-05-03T15:48:27.282582+00:00', changeStatus='same', visibility='visible', diff=None, json=None)

```python

```
