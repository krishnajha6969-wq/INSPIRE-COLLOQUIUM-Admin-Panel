const fs=require('fs'),vm=require('vm');
const els={};const element=id=>els[id]??={value:'',textContent:'',innerHTML:'',hidden:false,disabled:false,open:false,dataset:{},focus(){},scrollIntoView(){},setAttribute(){},addEventListener(){},showModal(){this.open=true},close(){this.open=false}};
const c={window:{addEventListener(){}},console,URL,Blob,AbortController,setTimeout,clearTimeout,setInterval(){},matchMedia:()=>({matches:false}),localStorage:{getItem:()=>null,setItem(){}},document:{getElementById:element,documentElement:{dataset:{}},querySelectorAll:()=>[],addEventListener(){}}};vm.createContext(c);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../index.html'),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1],c);
vm.runInContext(`
function check(x,m){if(!x)throw Error(m);console.log('PASS '+m)}
check($('total').textContent==='—','Disconnected counts unknown');
const m={fullName:'Leader',email:'test@example.invalid',mobile:'1234567890',college:'College',department:'CS',year:'2',isLeader:true};
records=[{id:'test',version:1,category:'UG',teamName:'Group',createdAt:new Date().toISOString(),members:[m,{...m,isLeader:false}],abstract:{submitted:true,text:'abc'},evaluation:{status:'selected'},payment:{status:'submitted'}}];loaded=true;validate(records);render();
check($('total').textContent===1,'Overall count');check($('unpaid').textContent===1,'Submitted payment awaiting verification');
$('search').value='leader';check(filtered().length===1,'Leader search');$('category').value='PG';check(filtered().length===0,'Category filter');$('category').value='';$('payment').value='awaiting';check(filtered().length===1,'Payment queue');$('date').value='today';check(filtered().length===1,'Today IST');$('date').value='yesterday';check(filtered().length===0,'Yesterday');
check(esc('<script>')==='&lt;script&gt;','HTML escaping');check(csvCell('=SUM(A1)').includes("'=SUM"),'CSV formula protection');check(safeLink('javascript:alert(1)','x')==='Not provided','Unsafe URL blocked');
let rejected=false;try{validate([{...records[0],category:'PG'}])}catch{rejected=true}check(rejected,'Individual member validation');theme('dark');check(document.documentElement.dataset.theme==='dark','Theme toggle');
`,c);

vm.runInContext(`
$('lockPassword').value='wrong';$('unlockForm').onsubmit({preventDefault(){}});
check(!unlocked,'Wrong password rejected');
$('lockPassword').value='1234';$('unlockForm').onsubmit({preventDefault(){}});
check(unlocked && !$('dashboard').hidden,'Correct password unlocks');
switchView('review');check($('evaluation').value==='pending','Review queue navigation');
switchView('payment');check($('payment').value==='awaiting' && $('evaluation').value==='selected','Payment queue navigation');
$('reset').onclick();check($('payment').value==='awaiting','Reset retains queue');
$('setupNav').onclick();check($('connection').open,'Backend setup opens');
lockDashboard();check(!unlocked && $('dashboard').hidden && records.length===0,'Lock clears records and hides dashboard');
`,c);
