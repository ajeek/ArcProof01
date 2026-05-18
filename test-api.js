fetch('http://localhost:3000/api/github-verify?username=nonexistentuser12345thisdoesnotexist')
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
