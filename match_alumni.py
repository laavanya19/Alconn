import sys
import json
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Get input data (student's interests and alumni profiles)
data = json.loads(sys.stdin.read())
student_interests = data['interests']
alumni_profiles = data['alumni']

# Extract the 'currentRole' and 'skillsRequired' for each alumni
alumni_texts = [alumni['currentRole'] + " " + " ".join(alumni['currentCompany']) for alumni in alumni_profiles]

# Use TF-IDF Vectorizer to convert text into numerical data
vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = vectorizer.fit_transform([student_interests] + alumni_texts)

# Calculate cosine similarity between student interest and alumni profiles
cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:])

# Get the top matches (highest cosine similarity)
matches = []
for idx, score in enumerate(cosine_sim[0]):
    matches.append({'profile': alumni_profiles[idx], 'score': score})

# Sort matches based on score (highest first)
matches.sort(key=lambda x: x['score'], reverse=True)

# Return the top 5 matches
top_matches = [match['profile'] for match in matches[:10]]

# Output the result
print(json.dumps(top_matches))
