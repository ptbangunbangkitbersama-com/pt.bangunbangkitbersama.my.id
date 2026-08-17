const menu=document.querySelector('.menu');
const nav=document.querySelector('.header nav');
menu?.addEventListener('click',()=>nav?.classList.toggle('show'));
document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>nav?.classList.remove('show')));

(() => {
  const track=document.getElementById('portfolioTrack');
  const status=document.getElementById('portfolioStatus');
  const prev=document.querySelector('.doc-prev');
  const next=document.querySelector('.doc-next');
  if(!track||!status||!prev||!next)return;

  // These are the exact filenames shown in the GitHub screenshot.
  const photos=[
    ['WhatsApp Image 2026-08-13 at 22.41.58 (1).jpg','Dokumentasi 01'],
    ['WhatsApp Image 2026-08-13 at 22.41.58 (2).jpg','Dokumentasi 02'],
    ['WhatsApp Image 2026-08-13 at 22.41.58.jpeg','Dokumentasi 03']
  ];

  let current=0;
  const makeUrl=name=>'./dokumentasi/'+encodeURIComponent(name);

  track.innerHTML=photos.map((p,i)=>`<figure class="doc-slide"><img src="${makeUrl(p[0])}" alt="${p[1]}" loading="${i?'lazy':'eager'}"><figcaption class="doc-caption">${p[1]}</figcaption></figure>`).join('');

  track.querySelectorAll('img').forEach((img,i)=>{
    img.addEventListener('error',()=>{
      img.closest('.doc-slide').innerHTML='<div class="doc-error">File tidak ditemukan:<br><strong>'+photos[i][0]+'</strong></div>';
    });
  });

  function update(){
    track.style.transform='translateX(-'+(current*100)+'%)';
    status.textContent='Dokumentasi '+(current+1)+' dari '+photos.length;
    prev.disabled=current===0;
    next.disabled=current===photos.length-1;
  }
  prev.onclick=()=>{if(current>0){current--;update()}};
  next.onclick=()=>{if(current<photos.length-1){current++;update()}};

  let sx=null;
  track.addEventListener('touchstart',e=>sx=e.touches[0].clientX,{passive:true});
  track.addEventListener('touchend',e=>{
    if(sx===null)return;
    const d=e.changedTouches[0].clientX-sx;
    if(Math.abs(d)>45){if(d<0&&current<photos.length-1)current++;if(d>0&&current>0)current--;update()}
    sx=null;
  },{passive:true});

  document.addEventListener('keydown',e=>{
    if(e.key==='ArrowLeft'&&current>0)current--;
    if(e.key==='ArrowRight'&&current<photos.length-1)current++;
    update();
  });
  update();
})();