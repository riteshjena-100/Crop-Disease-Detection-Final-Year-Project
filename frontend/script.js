// Initialize animations on page load
window.addEventListener('load', () => {
  document.querySelectorAll('.hidden-initially').forEach((el, index) => {
    setTimeout(() => {
      el.classList.remove('hidden-initially');
    }, index * 100);
  });
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById('darkModeToggle');
const html = document.documentElement;
const darkModeIcon = darkModeToggle.querySelector('.material-symbols-outlined');

// Check for saved theme preference or default to light mode
const currentTheme = localStorage.getItem('theme') || 'light';
if (currentTheme === 'dark') {
  html.classList.add('dark');
  darkModeIcon.textContent = 'light_mode';
} else {
  html.classList.remove('dark');
  darkModeIcon.textContent = 'dark_mode';
}

// Toggle dark mode
darkModeToggle.addEventListener('click', () => {
  html.classList.toggle('dark');
  
  if (html.classList.contains('dark')) {
    localStorage.setItem('theme', 'dark');
    darkModeIcon.textContent = 'light_mode';
  } else {
    localStorage.setItem('theme', 'light');
    darkModeIcon.textContent = 'dark_mode';
  }
});

// DOM Elements
const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const uploadZone = document.getElementById('uploadZone');
const previewSection = document.getElementById('previewSection');
const previewImg = document.getElementById('previewImg');
const fileName = document.getElementById('fileName');
const removeBtn = document.getElementById('removeBtn');
const analyzeBtn = document.getElementById('analyzeBtn');
const loadingState = document.getElementById('loadingState');
const resultsCard = document.getElementById('resultsCard');
const emptyState = document.getElementById('emptyState');
const resetBtn = document.getElementById('resetBtn');

// State
let selectedFile = null;

// Browse button click
browseBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput.click();
});

// Upload zone click
uploadZone.addEventListener('click', () => {
  fileInput.click();
});

// File input change
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) handleFile(file);
});

// Drag and drop functionality
uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  uploadZone.classList.add('drag-over');
});

uploadZone.addEventListener('dragleave', () => {
  uploadZone.classList.remove('drag-over');
});

uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  uploadZone.classList.remove('drag-over');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    handleFile(file);
  }
});

// Handle file selection
function handleFile(file) {
  selectedFile = file;
  const url = URL.createObjectURL(file);
  
  previewImg.style.backgroundImage = `url(${url})`;
  fileName.textContent = file.name;
  
  previewSection.classList.remove('hidden');
  previewSection.classList.add('flex');
  analyzeBtn.disabled = false;
}

// Remove image
removeBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  previewSection.classList.add('hidden');
  previewSection.classList.remove('flex');
  analyzeBtn.disabled = true;
});

// Analyze button
analyzeBtn.addEventListener('click', async () => {
  if (!selectedFile) return;

  // Show loading state
  emptyState.classList.add('hidden');
  resultsCard.classList.add('hidden');
  loadingState.classList.remove('hidden');
  analyzeBtn.disabled = true;

  const formData = new FormData();
  formData.append('file', selectedFile);

  try {
    const response = await fetch('http://127.0.0.1:5000/predict', {
      method: 'POST',
      body: formData
    });

    const data = await response.json();

    if (data.error) {
      alert('Error: ' + data.error);
      emptyState.classList.remove('hidden');
      loadingState.classList.add('hidden');
      analyzeBtn.disabled = false;
      return;
    }

    // Display results with animation delay
    setTimeout(() => {
      loadingState.classList.add('hidden');
      resultsCard.classList.remove('hidden');
      
      document.getElementById('diseaseName').textContent = data.predicted_class;
      document.getElementById('confidenceText').textContent = data.confidence + '%';
      document.getElementById('causeText').textContent = data.cause;
      document.getElementById('cureText').textContent = data.cure;
      
      // Animate confidence bar
      setTimeout(() => {
        document.getElementById('confidenceBar').style.width = data.confidence + '%';
      }, 100);
    }, 1500);

  } catch (error) {
    alert('Error: ' + error.message);
    emptyState.classList.remove('hidden');
    loadingState.classList.add('hidden');
    analyzeBtn.disabled = false;
  }
});

// Reset button
resetBtn.addEventListener('click', () => {
  selectedFile = null;
  fileInput.value = '';
  previewSection.classList.add('hidden');
  previewSection.classList.remove('flex');
  resultsCard.classList.add('hidden');
  emptyState.classList.remove('hidden');
  analyzeBtn.disabled = true;
  document.getElementById('confidenceBar').style.width = '0%';
});
