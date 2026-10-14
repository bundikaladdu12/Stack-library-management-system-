
/* Stacks — Library Management System
   Core structures are implemented manually: singly linked list, FIFO queue and LIFO stack. */
'use strict';
window.addEventListener('error', function (event) { try { const t=document.querySelector('#toast'); if(t){t.textContent='A script error occurred. Reopen the project in Chrome or use the hosted version.';t.classList.add('show');} } catch (_) {} });

class BookNode { constructor(book) { this.book = book; this.next = null; } }
class BookLinkedList {
  constructor() { this.head = null; this.tail = null; this.length = 0; }
  append(book) { const node = new BookNode(book); if (!this.head) this.head = node; else this.tail.next = node; this.tail = node; this.length++; return node; }
  findById(id) { let current = this.head; while (current) { if (current.book.id.toLowerCase() === id.toLowerCase()) return current.book; current = current.next; } return null; }
  removeById(id) { let current = this.head, previous = null; while (current) { if (current.book.id.toLowerCase() === id.toLowerCase()) { if (previous) previous.next = current.next; else this.head = current.next; if (this.tail === current) this.tail = previous; this.length--; return current.book; } previous = current; current = current.next; } return null; }
  toArray() { const result = []; let current = this.head; while (current) { result.push(current.book); current = current.next; } return result; }
  get size() { return this.length; }
}
class QueueNode { constructor(value) { this.value = value; this.next = null; } }
class Queue { constructor() { this.front = null; this.rear = null; this.length = 0; } enqueue(item) { const node = new QueueNode(item); if (!this.rear) this.front = node; else this.rear.next = node; this.rear = node; this.length++; } dequeue() { if (!this.front) return null; const item = this.front.value; this.front = this.front.next; if (!this.front) this.rear = null; this.length--; return item; } peek() { return this.front ? this.front.value : null; } isEmpty() { return this.front === null; } toArray() { const result = []; let node = this.front; while (node) { result.push(node.value); node = node.next; } return result; } get size() { return this.length; } }
class StackNode { constructor(value, next = null) { this.value = value; this.next = next; } }
class ActivityStack { constructor() { this.top = null; this.length = 0; } push(item) { this.top = new StackNode(item, this.top); this.length++; } pop() { if (!this.top) return null; const item = this.top.value; this.top = this.top.next; this.length--; return item; } peek() { return this.top ? this.top.value : null; } toArrayNewestFirst() { const result = []; let node = this.top; while (node) { result.push(node.value); node = node.next; } return result; } clear() { this.top = null; this.length = 0; } get size() { return this.length; } }

const STORAGE_KEY = 'stacks-library-v1';
const books = new BookLinkedList();
const requests = new Queue();
const activity = new ActivityStack();
let currentPage = 'overview';
let modalMode = null;
let toastTimeout;
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const today = new Date();
$('#today-label').textContent = today.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

function seedData() {
  const sample = [
    {id:'BK-1001', title:'Atomic Habits', author:'James Clear', status:'available', addedAt:Date.now()-86400000*1},
    {id:'BK-1002', title:'The Design of Everyday Things', author:'Don Norman', status:'issued', issuedTo:'Aarav Mehta', addedAt:Date.now()-86400000*2},
    {id:'BK-1003', title:'Deep Work', author:'Cal Newport', status:'available', addedAt:Date.now()-86400000*3},
    {id:'BK-1004', title:'Clean Code', author:'Robert C. Martin', status:'available', addedAt:Date.now()-86400000*4},
    {id:'BK-1005', title:'The Alchemist', author:'Paulo Coelho', status:'issued', issuedTo:'Riya Sharma', addedAt:Date.now()-86400000*5},
    {id:'BK-1006', title:'Thinking, Fast and Slow', author:'Daniel Kahneman', status:'available', addedAt:Date.now()-86400000*6}
  ];
  sample.forEach(book => books.append(book));
  activity.push({type:'return', message:'Collection initialized with sample records', detail:'6 sample book records', time:Date.now()-86400000});
  activity.push({type:'issue', message:'Book issued to Aarav Mehta', detail:'The Design of Everyday Things', time:Date.now()-3600000*5});
  activity.push({type:'issue', message:'Book issued to Riya Sharma', detail:'The Alchemist', time:Date.now()-3600000*2});
  requests.enqueue({id:'RQ-2001', bookId:'BK-1003', person:'Kabir Joshi', time:Date.now()-3600000*1.4});
  requests.enqueue({id:'RQ-2002', bookId:'BK-1001', person:'Ananya Rao', time:Date.now()-3600000*.6});
}
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify({books:books.toArray(), requests:requests.toArray(), activity:activity.toArrayNewestFirst().reverse()})); }
  catch (error) { console.warn('Could not save local data:', error); showToast('Unable to save data in this browser.'); }
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) { seedData(); saveState(); return; }
    const state = JSON.parse(raw);
    (Array.isArray(state.books) ? state.books : []).forEach(book => books.append(book));
    (Array.isArray(state.requests) ? state.requests : []).forEach(request => requests.enqueue(request));
    (Array.isArray(state.activity) ? state.activity : []).forEach(entry => activity.push(entry));
  } catch (error) { console.warn('Stored data could not be read; loading sample data.', error); seedData(); }
}
function recordActivity(type, message, detail='') { activity.push({type, message, detail, time:Date.now()}); saveState(); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimeout); toastTimeout = setTimeout(() => toast.classList.remove('show'), 2600); }
function timeAgo(timestamp) {
  const delta = Math.max(0, Date.now() - Number(timestamp || Date.now()));
  if (delta < 60000) return 'Just now';
  if (delta < 3600000) return `${Math.floor(delta/60000)} min ago`;
  if (delta < 86400000) return `${Math.floor(delta/3600000)} hr${Math.floor(delta/3600000)>1?'s':''} ago`;
  return new Date(timestamp).toLocaleDateString('en-US',{month:'short',day:'numeric'});
}
function timeLabel(timestamp) { return new Date(timestamp).toLocaleString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }
function initials(title) { return title.split(/\s+/).slice(0,2).map(word => word[0] || '').join('').toUpperCase(); }
function coverClass(index) { return `cover-${(index % 4) + 1}`; }
function statusPill(status) { const available = status === 'available'; return `<span class="status-pill ${available?'status-available':'status-issued'}">${available?'Available':'Issued'}</span>`; }
function activityMark(type) { return ({add:'+', issue:'↗', return:'↙', delete:'−', request:'≡', process:'✓', clear:'×'})[type] || '·'; }
function renderActivityItem(entry, full=false) {
  const label = ({add:'BOOK ADDED',issue:'BOOK ISSUED',return:'BOOK RETURNED',delete:'BOOK REMOVED',request:'REQUEST ADDED',process:'REQUEST PROCESSED',clear:'HISTORY CLEARED'})[entry.type] || 'SYSTEM';
  return `<div class="${full?'full-activity-row':'activity-item'}"><span class="activity-mark">${activityMark(entry.type)}</span><div class="activity-copy"><strong>${esc(entry.message)}</strong>${entry.detail?`<div>${esc(entry.detail)}</div>`:''}<small>${timeAgo(entry.time)}${full?` · ${esc(timeLabel(entry.time))}`:''}</small></div>${full?`<span class="activity-type">${label}</span>`:''}</div>`;
}
function renderOverview() {
  const all = books.toArray();
  $('#stat-total').textContent = all.length;
  $('#stat-available').textContent = all.filter(book=>book.status==='available').length;
  $('#stat-issued').textContent = all.filter(book=>book.status==='issued').length;
  $('#stat-pending').textContent = requests.size;
  $('#side-queue-count').textContent = requests.size;
  const recent = all.slice().sort((a,b)=>(b.addedAt||0)-(a.addedAt||0)).slice(0,4);
  $('#recent-books').innerHTML = recent.map((book,index)=>`<div class="recent-book"><span class="book-cover ${coverClass(index)}">${esc(initials(book.title))}</span><div><strong>${esc(book.title)}</strong><small>${esc(book.author)}</small></div><div class="book-meta-right">${statusPill(book.status)}</div></div>`).join('');
  $('#recent-books').classList.toggle('hidden',recent.length===0); $('#recent-empty').classList.toggle('hidden',recent.length!==0);
  const latest = activity.toArrayNewestFirst().slice(0,4);
  $('#recent-activity').innerHTML = latest.map(entry=>renderActivityItem(entry)).join('');
  $('#recent-activity').classList.toggle('hidden',latest.length===0); $('#activity-empty').classList.toggle('hidden',latest.length!==0);
}
function renderBooks() {
  const query = ($('#book-search')?.value || '').trim().toLowerCase();
  const filter = $('#book-filter')?.value || 'all';
  const filtered = books.toArray().filter(book => {
    const matches = [book.title,book.author,book.id].some(value=>String(value||'').toLowerCase().includes(query));
    return matches && (filter==='all' || book.status===filter);
  });
  $('#book-result-count').textContent = `${filtered.length} record${filtered.length===1?'':'s'}`;
  $('#book-list').innerHTML = filtered.map((book,index)=>`<div class="book-row"><div class="book-detail"><span class="book-cover ${coverClass(index)}">${esc(initials(book.title))}</span><div class="book-detail-text"><strong>${esc(book.title)}</strong><small>${esc(book.author)}</small></div></div><span class="book-id">${esc(book.id)}</span><span class="row-status">${statusPill(book.status)}</span><div class="row-actions">${book.status==='available'?`<button class="small-action issue" data-issue-book="${esc(book.id)}">Issue</button>`:`<button class="small-action" data-return-book="${esc(book.id)}">Return</button>`}<button class="small-action danger" data-delete-book="${esc(book.id)}" aria-label="Delete ${esc(book.title)}">Delete</button></div></div>`).join('');
  $('#book-list').classList.toggle('hidden',filtered.length===0); $('#books-empty').classList.toggle('hidden',filtered.length!==0);
}
function renderRequests() {
  const all = requests.toArray();
  $('#queue-total').textContent = all.length;
  $('#side-queue-count').textContent = all.length;
  $('#process-request').disabled = all.length===0;
  $('#request-list').innerHTML = all.map((request,index)=>{const book=books.findById(request.bookId);return `<div class="request-row"><span class="request-position">${String(index+1).padStart(2,'0')}</span><div class="request-book"><strong>${esc(book?.title || 'Book no longer in collection')}</strong><small>${esc(request.bookId)}</small></div><span class="request-person">${esc(request.person)}</span><span class="request-time">${esc(timeLabel(request.time))}</span><span class="status-pill status-pending">Pending</span></div>`;}).join('');
  $('#request-list').classList.toggle('hidden',all.length===0); $('#requests-empty').classList.toggle('hidden',all.length!==0);
}
function renderFullActivity() { const entries=activity.toArrayNewestFirst(); $('#full-activity').innerHTML=entries.map(entry=>renderActivityItem(entry,true)).join(''); $('#full-activity').classList.toggle('hidden',entries.length===0); $('#full-activity-empty').classList.toggle('hidden',entries.length!==0); }
function renderAll() { renderOverview(); renderBooks(); renderRequests(); renderFullActivity(); }
function navigate(page) {
  currentPage=page;
  $$('.page').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`));
  $$('.nav-item,.mobile-nav-item').forEach(el=>el.classList.toggle('active',el.dataset.page===page));
  const names={overview:'Overview',books:'Book collection',requests:'Issue requests',activity:'Activity log'};
  $('#crumb-current').textContent=names[page]||'Overview';
  window.scrollTo({top:0,behavior:'smooth'});
  if(page==='books') renderBooks(); if(page==='requests')renderRequests(); if(page==='activity')renderFullActivity();
}
function field(name,label,placeholder='',type='text',required=true) { return `<div class="form-field"><label for="field-${name}">${label}</label><input id="field-${name}" name="${name}" type="${type}" placeholder="${placeholder}" ${required?'required':''} autocomplete="off"></div>`; }
function selectField(name,label,options) { return `<div class="form-field"><label for="field-${name}">${label}</label><select id="field-${name}" name="${name}" required>${options}</select></div>`; }
function openModal(mode) {
  modalMode=mode; const fields=$('#modal-fields'); const title=$('#modal-title'); const eyebrow=$('#modal-eyebrow'); const description=$('#modal-description'); const submit=$('#modal-submit'); $('#modal-error').classList.add('hidden'); $('#modal-form').reset();
  if(mode==='add-book') { eyebrow.textContent='COLLECTION MANAGEMENT';title.textContent='Add a book';description.textContent='Enter the details for the new book record.';submit.textContent='Save book';fields.innerHTML=field('title','Book title','e.g. The Pragmatic Programmer')+field('author','Author','e.g. Andrew Hunt')+field('id','Book ID','e.g. BK-1007'); }
  if(mode==='new-request') { eyebrow.textContent='REQUEST SCHEDULING';title.textContent='New issue request';description.textContent='Add a member to the end of the request queue.';submit.textContent='Add to queue';const options=books.toArray().filter(book=>book.status==='available').map(book=>`<option value="${esc(book.id)}">${esc(book.title)} · ${esc(book.id)}</option>`).join('');fields.innerHTML=selectField('bookId','Book to request',options?'<option value="">Select a book</option>'+options:'<option value="">No available books</option>')+field('person','Member name','e.g. Aditi Deshmukh');submit.disabled=!options; }
  $('#modal-backdrop').classList.remove('hidden'); setTimeout(()=>$('#modal-fields input, #modal-fields select')?.focus(),60);
}
function closeModal() { $('#modal-backdrop').classList.add('hidden'); modalMode=null; }
function showFormError(message) { const error=$('#modal-error');error.textContent=message;error.classList.remove('hidden'); }
function addBook(formData) {
  const title=String(formData.get('title')||'').trim(),author=String(formData.get('author')||'').trim(),id=String(formData.get('id')||'').trim().toUpperCase();
  if(!title||!author||!id) return showFormError('Please complete all fields.');
  if(books.findById(id)) return showFormError('That book ID already exists. Use a unique ID.');
  const book={id,title,author,status:'available',addedAt:Date.now()};books.append(book);recordActivity('add','Book added to collection',`${title} · ${id}`);closeModal();renderAll();showToast('Book added to the collection.');
}
function addRequest(formData) {
  const bookId=String(formData.get('bookId')||''),person=String(formData.get('person')||'').trim();
  if(!bookId||!person)return showFormError('Select a book and enter the member name.');
  const book=books.findById(bookId);if(!book||book.status!=='available')return showFormError('This book is no longer available. Please select another.');
  requests.enqueue({id:`RQ-${Date.now().toString().slice(-6)}`,bookId,person,time:Date.now()});recordActivity('request','Issue request added',`${book.title} · ${person}`);closeModal();renderAll();showToast('Request added to the end of the queue.');
}
function issueBook(id,person='Library member') {
  const book=books.findById(id);if(!book)return showToast('Book record not found.');if(book.status!=='available')return showToast('This book is already issued.');
  book.status='issued';book.issuedTo=person;recordActivity('issue','Book issued',`${book.title} · ${person}`);renderAll();showToast('Book issued successfully.');
}
function returnBook(id) {
  const book=books.findById(id);if(!book)return showToast('Book record not found.');if(book.status!=='issued')return showToast('This book is already marked available.');
  const previousHolder=book.issuedTo||'Member';book.status='available';delete book.issuedTo;recordActivity('return','Book returned',`${book.title} · returned by ${previousHolder}`);renderAll();showToast('Book marked as available.');
}
function deleteBook(id) {
  const book=books.findById(id);if(!book)return;
  if(book.status==='issued')return showToast('Return this book before deleting its record.');
  if(requests.toArray().some(request=>request.bookId===id))return showToast('Remove or process its pending request before deleting.');
  if(!confirm(`Delete “${book.title}” from the collection?`))return;
  books.removeById(id);recordActivity('delete','Book removed from collection',`${book.title} · ${id}`);renderAll();showToast('Book record deleted.');
}
function processNextRequest() {
  const request=requests.peek();if(!request)return;
  const book=books.findById(request.bookId);
  if(!book){requests.dequeue();recordActivity('process','Request skipped','Book record no longer exists');saveState();renderAll();showToast('Request skipped: book record not found.');return;}
  if(book.status!=='available'){requests.dequeue();recordActivity('process','Request skipped',`${book.title} is not available`);saveState();renderAll();showToast('Request skipped: book is not available.');return;}
  requests.dequeue();book.status='issued';book.issuedTo=request.person;recordActivity('process','Request processed and book issued',`${book.title} · ${request.person}`);saveState();renderAll();showToast('Oldest request processed successfully.');
}

$$('[data-page]').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.page)));
document.addEventListener('click',event=>{
  const action=event.target.closest('[data-action]');if(action){const mode=action.dataset.action;if(mode==='add-book'||mode==='new-request')openModal(mode);}
  const goto=event.target.closest('[data-goto]');if(goto)navigate(goto.dataset.goto);
  const issue=event.target.closest('[data-issue-book]');if(issue){const id=issue.dataset.issueBook;const book=books.findById(id);if(book){modalMode='issue-book';$('#modal-eyebrow').textContent='ISSUE MANAGEMENT';$('#modal-title').textContent='Issue book';$('#modal-description').textContent=`Issue “${book.title}” to a library member.`;$('#modal-submit').textContent='Confirm issue';$('#modal-submit').disabled=false;$('#modal-error').classList.add('hidden');$('#modal-fields').innerHTML=field('person','Member name','e.g. Aditi Deshmukh');$('#modal-form').dataset.bookId=id;$('#modal-backdrop').classList.remove('hidden');setTimeout(()=>$('#field-person')?.focus(),60);}}
  const ret=event.target.closest('[data-return-book]');if(ret)returnBook(ret.dataset.returnBook);
  const del=event.target.closest('[data-delete-book]');if(del)deleteBook(del.dataset.deleteBook);
});
$('#book-search').addEventListener('input',renderBooks);$('#book-filter').addEventListener('change',renderBooks);
$('#process-request').addEventListener('click',processNextRequest);
$('#modal-close').addEventListener('click',closeModal);$('#modal-cancel').addEventListener('click',closeModal);
$('#modal-backdrop').addEventListener('click',event=>{if(event.target===$('#modal-backdrop'))closeModal();});
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!$('#modal-backdrop').classList.contains('hidden'))closeModal();});
$('#modal-form').addEventListener('submit',event=>{event.preventDefault();const data=new FormData(event.currentTarget);if(modalMode==='add-book')addBook(data);else if(modalMode==='new-request')addRequest(data);else if(modalMode==='issue-book'){const id=event.currentTarget.dataset.bookId;const person=String(data.get('person')||'').trim();if(!person)return showFormError('Enter the member name.');issueBook(id,person);delete event.currentTarget.dataset.bookId;closeModal();}});
$('#clear-activity').addEventListener('click',()=>{if(!activity.size)return showToast('Activity history is already empty.');if(!confirm('Clear all activity history? This will not change your book records or requests.'))return;activity.clear();saveState();renderAll();showToast('Activity history cleared.');});
loadState();renderAll();

  