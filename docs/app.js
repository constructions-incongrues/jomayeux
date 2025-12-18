// Configuration
const EXECUTIONS_DIR = '../executions/';

// État de l'application
let newsletterData = null;

// Initialisation
document.addEventListener('DOMContentLoaded', async () => {
    await loadNewsletter();
    if (newsletterData) {
        renderNewsletter();
    }
});

// Charger les données de la newsletter
async function loadNewsletter() {
    try {
        const jsonFiles = ['execution-8861.json'];
        
        let data = null;
        let lastError = null;
        
        for (const filename of jsonFiles) {
            try {
                const response = await fetch(`${EXECUTIONS_DIR}${filename}`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                    },
                    mode: 'cors'
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                let text = await response.text();
                text = text.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
                data = JSON.parse(text);
                break;
            } catch (error) {
                // Détecter les erreurs CORS
                if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
                    const isFileProtocol = window.location.protocol === 'file:';
                    if (isFileProtocol) {
                        throw new Error('CORS: Veuillez utiliser un serveur HTTP local. Ouvrez un terminal dans le dossier du projet et exécutez: python3 -m http.server 8000 puis accédez à http://localhost:8000/docs/');
                    } else {
                        throw new Error('CORS: Erreur de chargement. Vérifiez que le serveur autorise les requêtes CORS.');
                    }
                }
                lastError = error;
                continue;
            }
        }
        
        if (!data || !data.newsletter) {
            throw lastError || new Error('Aucun fichier JSON valide trouvé');
        }
        
        newsletterData = data.newsletter;
        
        document.getElementById('loading').classList.add('hidden');
        document.getElementById('newsletter').classList.remove('hidden');
    } catch (error) {
        console.error('Erreur lors du chargement:', error);
        const loadingEl = document.getElementById('loading');
        loadingEl.textContent = error.message || 'Erreur lors du chargement des données.';
        loadingEl.style.color = '#e74c3c';
        loadingEl.style.padding = '2rem';
        loadingEl.style.whiteSpace = 'pre-line';
    }
}

// Afficher la newsletter
function renderNewsletter() {
    if (!newsletterData) return;
    
    renderDate();
    renderAgenda();
    renderMembers();
    renderGallery();
}

// Afficher la date
function renderDate() {
    const dateContainer = document.querySelector('#newsletter .newsletter-date');
    if (newsletterData.date && dateContainer) {
        const date = new Date(newsletterData.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        dateContainer.textContent = formattedDate;
    }
}

// Afficher l'agenda
function renderAgenda() {
    const agendaContainer = document.querySelector('#newsletter .newsletter-agenda');
    const template = document.getElementById('template-agenda-item');
    
    if (!agendaContainer || !template) return;
    
    if (!newsletterData.agenda || newsletterData.agenda.length === 0) {
        return;
    }
    
    const sortedAgenda = [...newsletterData.agenda].sort((a, b) => {
        return new Date(a.date) - new Date(b.date);
    });
    
    sortedAgenda.forEach(item => {
        const agendaItem = template.content.cloneNode(true);
        
        const date = new Date(item.date);
        const formattedDate = date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        
        agendaItem.querySelector('.agenda-item-date').textContent = item.date;
        
        const event = item.event;
        const eventContainer = agendaItem.querySelector('.agenda-item-event');
        
        if (event.title) {
            eventContainer.querySelector('.event-title').textContent = event.title;
        } else {
            eventContainer.querySelector('.event-title').remove();
        }
        
        if (event.description) {
            eventContainer.querySelector('.event-description').textContent = event.description;
        } else {
            eventContainer.querySelector('.event-description').remove();
        }
        
        const linkEl = eventContainer.querySelector('.event-link');
        const linkContainer = eventContainer.querySelector('.event-link-container');
        
        if (event.link) {
            linkEl.textContent = event.link;
            linkEl.href = event.link;
            // Afficher le premier enfant (SVG) si le lien existe
            if (linkContainer && linkContainer.firstElementChild) {
                linkContainer.firstElementChild.style.display = '';
            }
        } else {
            linkEl.textContent = '';
            linkEl.href = '';
            // Masquer le premier enfant (SVG) si le lien est vide
            if (linkContainer && linkContainer.firstElementChild) {
                linkContainer.firstElementChild.style.display = 'none';
            }
        }
        
        if (event.location) {
            eventContainer.querySelector('.event-location').textContent = event.location;
        } else {
            eventContainer.querySelector('.event-location').remove();
        }
        
        agendaContainer.appendChild(agendaItem);
    });
}

// Afficher les membres
function renderMembers() {
    const membersContainer = document.querySelector('#newsletter .newsletter-members');
    const memberTemplate = document.getElementById('template-member');
    const contributionTemplate = document.getElementById('template-contribution');
    
    if (!membersContainer || !memberTemplate || !contributionTemplate) return;
    
    if (!newsletterData.members || newsletterData.members.length === 0) {
        return;
    }
    
    newsletterData.members.forEach(member => {
        const memberCard = memberTemplate.content.cloneNode(true);
        memberCard.querySelector('.member-name').textContent = member.name;
        
        const contributionsContainer = memberCard.querySelector('.member-contributions');
        
        member.contributions.forEach(contribution => {
            const contributionCard = contributionTemplate.content.cloneNode(true);
            
            if (contribution.type) {
                contributionCard.querySelector('.contribution-type').textContent = contribution.type;
            } else {
                contributionCard.querySelector('.contribution-type').remove();
            }
            
            if (contribution.title) {
                contributionCard.querySelector('.contribution-title').textContent = contribution.title;
            } else {
                contributionCard.querySelector('.contribution-title').remove();
            }
            
            if (contribution.description) {
                contributionCard.querySelector('.contribution-description').textContent = contribution.description;
            } else {
                contributionCard.querySelector('.contribution-description').remove();
            }
            
            if (contribution.link) {
                const linkEl = contributionCard.querySelector('.contribution-link');
                linkEl.textContent = contribution.link;
                linkEl.href = contribution.link;
            } else {
                contributionCard.querySelector('.contribution-link').remove();
            }
            
            if (contribution.location) {
                contributionCard.querySelector('.contribution-location').textContent = contribution.location;
            } else {
                contributionCard.querySelector('.contribution-location').remove();
            }
            
            contributionsContainer.appendChild(contributionCard);
        });
        
        membersContainer.appendChild(memberCard);
    });
}

// Afficher la galerie
function renderGallery() {
    const galleryContainer = document.querySelector('#newsletter .newsletter-gallery');
    const template = document.getElementById('template-gallery-item');
    
    if (!galleryContainer || !template) return;
    
    if (!newsletterData.gallery || newsletterData.gallery.length === 0) {
        return;
    }
    
    newsletterData.gallery.forEach(item => {
        const galleryItem = template.content.cloneNode(true);
        
        if (item.type) {
            galleryItem.querySelector('.gallery-item-type').textContent = item.type;
        } else {
            galleryItem.querySelector('.gallery-item-type').remove();
        }
        
        if (item.url) {
            const urlEl = galleryItem.querySelector('.gallery-item-url');
            if (item.type === 'image') {
                const img = document.createElement('img');
                img.src = item.url;
                img.alt = item.description || '';
                img.loading = 'lazy';
                urlEl.appendChild(img);
            } else if (item.type === 'video') {
                const videoId = extractYouTubeId(item.url);
                if (videoId) {
                    const iframe = document.createElement('iframe');
                    iframe.src = `https://www.youtube.com/embed/${videoId}`;
                    iframe.frameBorder = '0';
                    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture';
                    iframe.allowFullscreen = true;
                    urlEl.appendChild(iframe);
                } else {
                    const link = document.createElement('a');
                    link.href = item.url;
                    link.textContent = item.url;
                    link.target = '_blank';
                    link.rel = 'noopener';
                    urlEl.appendChild(link);
                }
            } else {
                urlEl.textContent = item.url;
            }
        } else {
            galleryItem.querySelector('.gallery-item-url').remove();
        }
        
        if (item.description) {
            galleryItem.querySelector('.gallery-item-description').textContent = item.description;
        } else {
            galleryItem.querySelector('.gallery-item-description').remove();
        }
        
        galleryContainer.appendChild(galleryItem);
    });
}

// Extraire l'ID d'une URL YouTube
function extractYouTubeId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}
