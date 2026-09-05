import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

const SUPABASE_URL = 'https://tpvvrfornspqgjwogxag.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRwdnZyZm9ybnNwcWdqd29neGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg0MjYyNjAsImV4cCI6MjEwNDAwMjI2MH0.wpymx6pvBR1LQ8s0kKjB9EXcoJGO2S5nOxXvI84z4Wo';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchItems() {
    const listElement = document.getElementById('items-list');
    const { data, error } = await supabase.from('items').select('*');
    
    if (error) {
        listElement.innerHTML = `<li>Error loading data: ${error.message}</li>`;
        return;
    }

    if (data.length === 0) {
        listElement.innerHTML = '<li>No items found in database.</li>';
        return;
    }

    listElement.innerHTML = data.map(item => `<li>${item.name || JSON.stringify(item)}</li>`).join('');
}

document.getElementById('add-btn').addEventListener('click', async () => {
    const input = document.getElementById('item-input');
    const value = input.value.trim();
    if (!value) return;

    const { error } = await supabase.from('items').insert([{ name: value }]);
    if (error) {
        alert('Error inserting data: ' + error.message);
    } else {
        input.value = '';
        fetchItems();
    }
});

// Initial fetch
fetchItems();
