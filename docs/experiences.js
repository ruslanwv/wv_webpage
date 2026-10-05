(() => {
  const examples = {
    sina: {before:'compare-sina-before.png',after:'compare-sina-after.png',label:'ENHANCED',alt:'Seismic image after SINA noise attenuation',caption:'SINA: compare the texture of the noise and the continuity of seismic reflectors.',annotation:'Reflector detail',url:'https://waverity.ai/what-we-do/sina/'},
    siqe: {before:'compare-siqe-before.jpg',after:'compare-siqe-after.jpg',label:'ENHANCED',alt:'Seismic image after SIQE quality enhancement',caption:'SIQE: compare the separation and definition of seismic reflectors.',annotation:'Reflector detail',url:'https://waverity.ai/what-we-do/siqe/'},
    motivo: {before:'compare-motivo-before.png',after:'compare-motivo-after.png',label:'INTERPRETED',alt:'MOTIVO seismic interpretation example',caption:'MOTIVO: explore a published image alongside its interpretation example.',annotation:'Channel patterns',url:'https://waverity.ai/what-we-do/motivo/'}
  };
  const stage = document.querySelector('.compare-stage');
  const range = document.querySelector('#compare-range');
  function setPosition(value) {
    const position = Math.max(0,Math.min(100,Number(value)));
    if (!Number.isFinite(position)) return;
    range.value = String(Math.round(position));
    range.setAttribute('aria-valuetext',`${Math.round(position)} percent processed image revealed`);
    stage.style.setProperty('--compare-position',`${position}%`);
    document.querySelector('#compare-value').textContent=`${Math.round(position)}%`;
  }
  function selectExample(key) {
    const example=examples[key];if(!example)return;
    document.querySelector('#compare-before').src=example.before;
    document.querySelector('#compare-after').src=example.after;
    document.querySelector('#compare-after').alt=example.alt;
    document.querySelector('.compare-label-left').textContent=example.label;
    document.querySelector('#compare-caption').textContent=example.caption;
    document.querySelector('#annotation-label').textContent=example.annotation;
    document.querySelector('#compare-source').href=example.url;
    stage.dataset.example=key;
    document.querySelectorAll('[data-compare]').forEach(button=>{
      button.classList.toggle('selected',button.dataset.compare===key);
      button.setAttribute('aria-pressed',String(button.dataset.compare===key));
    });
  }
  range.addEventListener('input',()=>setPosition(range.value));
  document.querySelectorAll('[data-compare]').forEach(button=>button.addEventListener('click',()=>selectExample(button.dataset.compare)));
  let dragging=false;
  function drag(event){const rect=stage.getBoundingClientRect();setPosition((event.clientX-rect.left)/rect.width*100);}
  stage.addEventListener('pointerdown',event=>{
    if(event.button!==0)return;
    dragging=true;stage.setPointerCapture(event.pointerId);drag(event);
  });
  stage.addEventListener('pointermove',event=>{if(dragging)drag(event)});
  ['pointerup','pointercancel','lostpointercapture'].forEach(type=>stage.addEventListener(type,()=>{dragging=false}));
  document.querySelector('#compare-annotations').addEventListener('change',event=>{document.querySelector('.compare-annotation').hidden=!event.target.checked});
  document.querySelectorAll('[data-open-compare]').forEach(link=>link.addEventListener('click',()=>selectExample(link.dataset.openCompare)));

  const chapters=[...document.querySelectorAll('.journey-chapter')];
  const chapterNames=['The surface','The seismic image','The reservoir','Ahead of the bit'];
  const visual=document.querySelector('.journey-visual');
  const depths=[8,33,61,86];
  let current=-1, frame=0;
  function setStage(index){
    if(index===current)return;
    current=index;
    visual.style.setProperty('--journey-depth',`${depths[index]}%`);
    visual.style.setProperty('--path-reveal',String([0,28,66,100][index]));
    document.querySelector('#journey-current').textContent=`0${index+1} / ${chapterNames[index]}`;
    chapters.forEach((chapter,i)=>chapter.classList.toggle('active',i===index));
    document.querySelectorAll('.journey-links>a').forEach((link,i)=>{
      if(i===index)link.setAttribute('aria-current','step');else link.removeAttribute('aria-current');
    });
  }
  function followJourney(){
    frame=0;const middle=window.innerHeight*.5;
    const nearest=chapters.map((chapter,index)=>({index,distance:Math.abs(chapter.getBoundingClientRect().top+chapter.offsetHeight*.5-middle)})).sort((a,b)=>a.distance-b.distance)[0];
    if(nearest)setStage(nearest.index);
  }
  window.addEventListener('scroll',()=>{if(!frame)frame=requestAnimationFrame(followJourney)},{passive:true});
  window.addEventListener('resize',followJourney,{passive:true});
  setStage(0);
  document.querySelectorAll('.journey-links>a').forEach((link,index)=>link.addEventListener('click',()=>setStage(index)));

  const storyTabs=[...document.querySelectorAll('[data-story]')];
  function selectStory(key,focus=false){
    storyTabs.forEach(tab=>{
      const selected=tab.dataset.story===key;
      tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;
      document.querySelector(`#story-${tab.dataset.story}`).hidden=!selected;
      if(selected&&focus)tab.focus();
    });
    window.dispatchEvent(new Event('experiences:layout'));
  }
  storyTabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectStory(tab.dataset.story));
    tab.addEventListener('keydown',event=>{
      const offsets={ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1};
      let next;
      if(event.key in offsets)next=(index+offsets[event.key]+storyTabs.length)%storyTabs.length;
      else if(event.key==='Home')next=0;else if(event.key==='End')next=storyTabs.length-1;
      if(next!==undefined){event.preventDefault();selectStory(storyTabs[next].dataset.story,true)}
    });
  });
})();
