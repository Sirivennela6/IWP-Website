document.getElementById('projectForm').addEventListener('submit', function (e) {
  const title = document.getElementById('title').value.trim();
  const abstract = document.getElementById('abstract').value.trim();
  const domain = document.getElementById('domain').value;
  const guide = document.getElementById('guide').value.trim();
  const classSection = document.getElementById('classSection').value;
  const student = document.getElementById('studentInfo').value;
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];

  if (!title || !abstract || !domain || !guide || !classSection || !student || !file) {
    alert('⚠️ Please fill all fields and upload a file before submitting.');
    e.preventDefault();
    return;
  }

  const maxSizeMB = 2;
  const fileSizeMB = file.size / (1024 * 1024);
  if (fileSizeMB > maxSizeMB) {
    alert(`❌ File size exceeds ${maxSizeMB} MB limit. Please compress it.`);
    e.preventDefault();
    return;
  }

  alert('✅ Project submitted successfully!');
});
