document.getElementById('projectForm').addEventListener('submit', function (e) {
  const title = document.getElementById('title').value.trim();
  const abstract = document.getElementById('abstract').value.trim();
  const domain = document.getElementById('domain').value;
  const guide = document.getElementById('guide').value.trim();
  const file = document.getElementById('file').files.length;

  if (!title || !abstract || !domain || !guide || file === 0) {
    alert('Please fill all fields before submitting.');
    e.preventDefault();
  } else {
    alert('Project submitted successfully!');
  }
});
