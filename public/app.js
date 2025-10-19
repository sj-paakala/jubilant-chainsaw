const base = '/api/foods';

// Track current search param
let searchTerm = '';

async function searchFoods() {
  const params = new URLSearchParams({
    q: searchTerm
  });

  const res = await fetch(`${base}/search?${params}`);
  const data = await res.json();
  
  const list = document.getElementById('entries');
  list.innerHTML = '';
  
  if (data.length === 0) {
    list.innerHTML = '<li class="no-results">No matching foods found</li>';
    return;
  }

  data.forEach(item => {
    const li = document.createElement('li');
    li.textContent = `${item.name}${item.calories ? ` — ${item.calories} kcal` : ''}`;
    const notes = item.notes ? ` — ${item.notes}` : '';
    li.textContent += notes;
    list.appendChild(li);
  });
}

// Set up search handler
document.getElementById('search').addEventListener('input', (e) => {
  searchTerm = e.target.value.trim();
  searchFoods();
});

// Add button handler
document.getElementById('add-btn').addEventListener('click', () => {
  const searchText = document.getElementById('search').value.trim();
  if (searchText) {
    // Here you can handle what happens when Add is clicked
    console.log('Add clicked with:', searchText);
  }
});

// Initial load
searchFoods();