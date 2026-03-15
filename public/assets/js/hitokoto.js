fetch('https://v1.hitokoto.cn')
  .then(response => response.json())
  .then(data => {
    const hitokotoText = document.querySelector('#hitokoto_text');
    const authorText = document.querySelector('#author');
    const fromText = document.querySelector('#from');
    hitokotoText.href = `https://hitokoto.cn/?uuid=${data.uuid}`;
    hitokotoText.innerText = data.hitokoto;

    authorText.innerText = data.from_who || '——';
    fromText.innerText = data.from ? `《${data.from}》` : '';
  })
  .catch(console.error);