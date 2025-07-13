from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException
from webdriver_manager.chrome import ChromeDriverManager
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
import time
import re
from typing import List, Dict, Set

class NutritionWebScraper:
    def __init__(self, headless=True):
        """Initialize the scraper with Chrome options"""
        self.chrome_options = Options()
        if headless:
            self.chrome_options.add_argument("--headless")
        self.chrome_options.add_argument("--no-sandbox")
        self.chrome_options.add_argument("--disable-dev-shm-usage")
        self.chrome_options.add_argument("--disable-gpu")
        self.chrome_options.add_argument("--window-size=1920,1080")
        self.chrome_options.add_argument("--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36")
        
        self.visited_urls = set()
        self.max_pages_per_site = 50
        self.max_depth = 3
        
    def get_driver(self):
        """Get a new Chrome driver instance"""
        service = Service(ChromeDriverManager().install())
        return webdriver.Chrome(service=service, options=self.chrome_options)
    
    def wait_for_page_load(self, driver, timeout=10):
        """Wait for page to load completely"""
        try:
            WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, "body"))
            )
            # Additional wait for dynamic content
            time.sleep(2)
        except TimeoutException:
            pass
    
    def scroll_page(self, driver):
        """Scroll through the page to load lazy content"""
        try:
            # Scroll to bottom
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
            time.sleep(1)
            
            # Scroll to top
            driver.execute_script("window.scrollTo(0, 0);")
            time.sleep(1)
            
            # Scroll to middle
            driver.execute_script("window.scrollTo(0, document.body.scrollHeight/2);")
            time.sleep(1)
        except Exception as e:
            pass
    
    def extract_text_content(self, driver) -> str:
        """Extract clean text content from the page"""
        try:
            # Get page source and parse with BeautifulSoup
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            # Remove unwanted elements
            for element in soup(['script', 'style', 'nav', 'header', 'footer', 'aside', 'iframe']):
                element.decompose()
            
            # Try to find main content areas
            content_selectors = [
                'main', 'article', '.content', '.main-content', '.post-content',
                '.entry-content', '#content', '.article-content', '.page-content'
            ]
            
            content = ""
            for selector in content_selectors:
                elements = soup.select(selector)
                if elements:
                    content += ' '.join([elem.get_text(strip=True) for elem in elements])
                    break
            
            # If no main content found, get body text
            if not content.strip():
                content = soup.get_text(strip=True)
            
            # Clean up the text
            content = re.sub(r'\s+', ' ', content)  # Remove extra whitespace
            content = re.sub(r'\n+', '\n', content)  # Clean up newlines
            
            return content
            
        except Exception as e:
            return ""
    
    def find_nutrition_links(self, driver, base_url: str) -> List[str]:
        """Find nutrition-related links on the current page"""
        nutrition_keywords = [
            'nutrition', 'diet', 'food', 'health', 'diabetes', 'protein', 
            'carbohydrates', 'fats', 'vitamins', 'minerals', 'fiber', 'calories',
            'nutrients', 'dietary', 'eating', 'meal', 'recipe', 'ingredient',
            'supplement', 'vitamin', 'mineral', 'antioxidant', 'omega', 'fatty acid'
        ]
        
        links = []
        try:
            # Find all links
            elements = driver.find_elements(By.TAG_NAME, "a")
            
            for element in elements:
                try:
                    href = element.get_attribute('href')
                    link_text = element.text.lower()
                    
                    if href and href.startswith('http'):
                        # Check if link is nutrition-related
                        is_nutrition_related = any(
                            keyword in link_text or keyword in href.lower() 
                            for keyword in nutrition_keywords
                        )
                        
                        # Check if it's within the same domain
                        same_domain = urlparse(href).netloc == urlparse(base_url).netloc
                        
                        if is_nutrition_related and same_domain:
                            links.append(href)
                            
                except Exception as e:
                    continue
                    
        except Exception as e:
            pass
        
        return list(set(links))  # Remove duplicates
    
    def scrape_single_page(self, driver, url: str) -> str:
        """Scrape a single page and return its content"""
        try:
            driver.get(url)
            self.wait_for_page_load(driver)
            self.scroll_page(driver)
            
            content = self.extract_text_content(driver)
            
            return content
            
        except Exception as e:
            return ""
    
    def scrape_website_comprehensive(self, base_url: str) -> str:
        """Comprehensive scraping of a website with navigation and pagination"""
        
        driver = self.get_driver()
        all_content = []
        pages_scraped = 0
        
        try:
            # Start with the base URL
            if base_url not in self.visited_urls:
                content = self.scrape_single_page(driver, base_url)
                if content:
                    all_content.append(content)
                    pages_scraped += 1
                self.visited_urls.add(base_url)
            
            # Find and scrape related pages
            if pages_scraped < self.max_pages_per_site:
                nutrition_links = self.find_nutrition_links(driver, base_url)
                
                for link in nutrition_links:
                    if pages_scraped >= self.max_pages_per_site:
                        break
                        
                    if link not in self.visited_urls:
                        content = self.scrape_single_page(driver, link)
                        if content and len(content) > 100:  # Only add if meaningful content
                            all_content.append(content)
                            pages_scraped += 1
                        self.visited_urls.add(link)
                        
                        # Small delay to be respectful
                        time.sleep(1)
            
        except Exception as e:
            pass
        finally:
            driver.quit()
        
        return '\n\n'.join(all_content)
    
    def scrape_pubmed(self, base_url: str) -> str:
        """Specialized scraper for PubMed"""
        
        driver = self.get_driver()
        all_content = []
        
        try:
            # Scrape main page
            driver.get(base_url)
            self.wait_for_page_load(driver)
            
            # Search for nutrition-related terms - expanded for better coverage
            search_terms = [
                # Core nutrition topics
                "diabetes nutrition management",
                "protein diet benefits",
                "carbohydrates health effects",
                "vitamins minerals deficiency",
                "dietary fiber benefits",
                "nutritional supplements safety",
                
                # Additional important nutrition topics
                "omega 3 fatty acids",
                "antioxidants health",
                "probiotics gut health",
                "calcium bone health",
                "iron deficiency anemia",
                "vitamin D deficiency",
                "B vitamins energy",
                "zinc immune system",
                "magnesium muscle function",
                "potassium blood pressure",
                "sodium hypertension",
                "folic acid pregnancy",
                "vitamin C immunity",
                "vitamin E antioxidant",
                "vitamin K blood clotting",
                "selenium thyroid function",
                "copper metabolism",
                "manganese bone formation",
                "chromium blood sugar",
                "molybdenum enzyme function",
                "iodine thyroid health"
            ]
            
            for term in search_terms[:3]:  # Limit to avoid too many requests
                try:
                    # Find search box and enter term
                    search_box = driver.find_element(By.ID, "term")
                    search_box.clear()
                    search_box.send_keys(term)
                    
                    # Click search button
                    search_button = driver.find_element(By.CLASS_NAME, "search-btn")
                    search_button.click()
                    
                    self.wait_for_page_load(driver)
                    
                    # Extract results
                    content = self.extract_text_content(driver)
                    if content:
                        all_content.append(f"PubMed Search Results for '{term}':\n{content}")
                    
                    time.sleep(2)
                    
                except Exception as e:
                    continue
        
        except Exception as e:
            pass
        finally:
            driver.quit()
        
        return '\n\n'.join(all_content)
    
    def scrape_fdc(self, base_url: str) -> str:
        """Specialized scraper for Food Data Central"""
        
        driver = self.get_driver()
        all_content = []
        
        try:
            # Scrape main page
            driver.get(base_url)
            self.wait_for_page_load(driver)
            self.scroll_page(driver)
            
            # Extract main content
            content = self.extract_text_content(driver)
            if content:
                all_content.append(content)
            
            # Look for food search functionality
            try:
                # Find search box and search for common foods
                search_terms = ["apple", "chicken", "rice", "spinach", "salmon"]
                
                for term in search_terms[:2]:  # Limit searches
                    try:
                        search_box = driver.find_element(By.NAME, "query")
                        search_box.clear()
                        search_box.send_keys(term)
                        
                        # Submit search
                        search_box.submit()
                        self.wait_for_page_load(driver)
                        
                        # Extract results
                        results_content = self.extract_text_content(driver)
                        if results_content:
                            all_content.append(f"FDC Search Results for '{term}':\n{results_content}")
                        
                        time.sleep(2)
                        
                    except Exception as e:
                        continue
                        
            except Exception as e:
                pass
        
        except Exception as e:
            pass
        finally:
            driver.quit()
        
        return '\n\n'.join(all_content)
    
    def scrape_all_websites(self) -> Dict[str, str]:
        """Scrape all target websites"""
        websites = {
            "pubmed": "https://pubmed.ncbi.nlm.nih.gov/",
            "fdc": "https://fdc.nal.usda.gov/",
            "eatright": "https://www.eatright.org/",
            "harvard_nutrition": "https://nutritionsource.hsph.harvard.edu/"
        }
        
        results = {}
        
        for name, url in websites.items():
            if name == "pubmed":
                content = self.scrape_pubmed(url)
            elif name == "fdc":
                content = self.scrape_fdc(url)
            else:
                content = self.scrape_website_comprehensive(url)
            
            results[name] = content
        
        return results 