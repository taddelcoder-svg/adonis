const WD=['So','Mo','Di','Mi','Do','Fr','Sa'],WORDER=[1,2,3,4,5,6,0];
const EQ=[['kh','Kurzhanteln'],['stange','Klimmzugstange'],['kabel','Kabelzug / Bänder'],['lh','Langhantel'],['bank','Hantelbank'],['rolle','Ab Roller'],['ruck','Rucksack mit Gewicht'],['gym','Fitnessstudio (alles)']];
const GN={brust:'Brust',schulter:'Schultern',trizeps:'Trizeps',rueckenV:'Rücken (Zug von oben)',rueckenH:'Rücken (Rudern)',bizeps:'Bizeps',quad:'Beine vorne',hintere:'Beine hinten / Gesäß',waden:'Waden',core:'Bauch & Core'};
const GOALS=[['aufbau','Muskelaufbau'],['halten','Fit bleiben / Gewicht halten'],['abnehmen','Fett abbauen (Definition)']];
const LVS=[['1','Anfänger (unter 6 Monate)'],['2','Fortgeschritten (6–24 Monate)'],['3','Erfahren (über 2 Jahre)']];
const DAILY=[['0','Überwiegend sitzend'],['1','Viel in Bewegung'],['2','Körperlich aktiv']];
const SEX=[['m','Männlich'],['w','Weiblich'],['d','Divers / keine Angabe']];
// [id, Name, Gruppe, braucht, Sätze, Wdh, mit Gewicht, Level]
const DB=[
['lie','Liegestütze','brust',[],3,'8-15',0,1],['lie_f','Liegestütze (Füße erhöht)','brust',[],4,'8-15',0,2],['lie_b','Breitgriff-Liegestütze','brust',[],3,'10-20',0,2],['lie_a','Archer-Liegestütze','brust',[],3,'5-10 je Seite',0,3],
['fp','Floor Press (Kurzhanteln)','brust',['kh'],3,'8-12',1,1],['bd_kh','Bankdrücken (Kurzhanteln)','brust',['kh','bank'],3,'8-12',1,2],['bd_lh','Bankdrücken (Langhantel)','brust',['lh','bank'],4,'6-10',1,2],['lie_r','Liegestütze mit Rucksack','brust',['ruck'],3,'8-15',1,2],['brp','Brustpresse (Gerät)','brust',['gym'],3,'8-12',1,1],
['pike','Pike-Liegestütze','schulter',[],3,'8-12',0,2],['sh_kh','Schulterdrücken (Kurzhanteln)','schulter',['kh'],3,'8-12',1,1],['sh_lh','Schulterdrücken (Langhantel)','schulter',['lh'],3,'6-10',1,2],['sh_s','Seitheben (Kurzhanteln)','schulter',['kh'],3,'12-20',1,1],['sh_sk','Seitheben (Kabel/Band)','schulter',['kabel'],3,'12-20',1,1],['fpl','Face Pulls (Kabel/Band)','schulter',['kabel'],3,'15',1,1],['hand','Handstand-Liegestütze (Wand)','schulter',[],3,'3-8',0,3],
['dip','Dips (zwischen zwei Stühlen)','trizeps',[],3,'8-15',0,1],['dia','Diamant-Liegestütze','trizeps',[],3,'8-15',0,2],['tri_u','Trizeps-Überkopfdrücken','trizeps',['kh'],3,'12-15',1,1],['tri_k','Trizepsdrücken (Kabel/Band)','trizeps',['kabel'],3,'12-15',1,1],['skull','Skull Crushers (Langhantel)','trizeps',['lh','bank'],3,'8-12',1,2],
['klim','Klimmzüge','rueckenV',['stange'],4,'max (Ziel 8+)',0,2],['chin','Chin-Ups','rueckenV',['stange'],3,'max',0,2],['klim_n','Negative Klimmzüge (langsam ab)','rueckenV',['stange'],3,'4-8',0,1],['latz','Latzug (Kabel)','rueckenV',['kabel'],3,'10-15',1,1],
['row_k','Kabelrudern / Band','rueckenH',['kabel'],3,'12-15',1,1],['row_kh','Kurzhantel-Rudern einarmig','rueckenH',['kh'],3,'12-15 je Seite',1,1],['row_lh','Rudern vorgebeugt (Langhantel)','rueckenH',['lh'],3,'8-12',1,2],['row_g','Rudern am Gerät','rueckenH',['gym'],3,'8-12',1,1],['rfly','Reverse Fly (Kurzhanteln)','rueckenH',['kh'],3,'12-15',1,1],['row_t','Rudern unter stabilem Tisch','rueckenH',[],3,'8-12',0,1],['super','Superman','rueckenH',[],3,'12-15 (2 Sek. halten)',0,1],
['curl','Kurzhantel-Curls','bizeps',['kh'],3,'10-15',1,1],['ham','Hammer Curls','bizeps',['kh'],3,'10-15',1,1],['curl_k','Curls (Kabel/Band)','bizeps',['kabel'],3,'10-15',1,1],['curl_l','Langhantel-Curls','bizeps',['lh'],3,'8-12',1,2],['curl_r','Rucksack-Curls','bizeps',['ruck'],3,'10-15',1,1],
['sq','Kniebeugen','quad',[],3,'15-25',0,1],['gob','Goblet Squats','quad',['kh'],3,'10-15',1,1],['bss','Bulgarian Split Squats','quad',[],4,'10-12 je Bein',0,2],['lunge','Ausfallschritte','quad',[],3,'12 je Bein',0,1],['sq_l','Kniebeugen (Langhantel)','quad',['lh'],4,'6-10',1,2],['sq_r','Rucksack-Kniebeugen','quad',['ruck'],3,'10-15',1,1],['pist','Pistol Squats (assistiert)','quad',[],3,'3-6 je Bein',0,3],['lpress','Beinpresse (Gerät)','quad',['gym'],3,'10-15',1,1],
['rdl','Rumänisches Kreuzheben (Kurzhanteln)','hintere',['kh'],3,'12-15',1,1],['dl','Kreuzheben (Langhantel)','hintere',['lh'],3,'5-8',1,2],['bridge','Glute Bridge','hintere',[],3,'15-20',0,1],['hipt','Einbeiniger Hip Thrust','hintere',[],3,'10-15 je Bein',0,2],['lcurl','Beinbeuger (Gerät)','hintere',['gym'],3,'10-15',1,1],
['calf','Wadenheben einbeinig','waden',[],4,'15-20',0,1],
['lr','Beinheben im Liegen','core',[],3,'12-15',0,1],['hlr','Hängendes Beinheben','core',['stange'],3,'8-15',0,2],['crunch','Crunches','core',[],3,'15-20',0,1],['side','Seitlicher Crunch','core',[],3,'15 je Seite',0,1],['toe','Zehenberührung (Obliques)','core',[],3,'15 je Seite',0,1],['mtn','Bergsteiger','core',[],3,'30-40 Sek.',0,1],['plank','Plank','core',[],3,'30-60 Sek.',0,1],['roll','Ab Roller','core',['rolle'],3,'8-12',0,2],['cabc','Kabel-Crunch','core',['kabel'],3,'12-15',1,1]
];
// Technik: [So geht's, Typischer Fehler]
const TIPS={
lie:['Körper bildet eine Linie, Ellbogen etwa 45° zum Körper, Brust fast bis zum Boden.','Hohlkreuz oder hängende Hüfte.'],
lie_f:['Füße auf Stuhl oder Bank, Rumpf fest, Ellbogen eng am Körper, volle Bewegung.','Kopf nach vorn geschoben, Hüfte sackt durch.'],
lie_b:['Hände weiter als schulterbreit, Brust bis kurz über den Boden, kontrolliert hoch.','Ellbogen zu weit nach außen, halbe Bewegung.'],
lie_a:['Weit stehen, Gewicht auf einen Arm verlagern, der andere Arm bleibt gestreckt.','Zu schnell, Hüfte dreht auf.'],
fp:['Auf dem Rücken liegen, Ellbogen berühren kurz den Boden, dann kräftig hochdrücken.','Ellbogen zu weit abgespreizt.'],
bd_kh:['Schulterblätter zusammen und nach unten, Hanteln auf Brusthöhe senken, kontrolliert drücken.','Schultern nach vorn gerollt, Hanteln schwingen.'],
bd_lh:['Füße fest am Boden, Stange zur unteren Brust senken, Handgelenke gerade.','Hintern hebt ab, Stange federt von der Brust.'],
lie_r:['Rucksack fest zurren, sonst wie normale Liegestütze, Körper bleibt gerade.','Rucksack rutscht, Hüfte sackt durch.'],
brp:['Sitz einstellen, Griffe auf Brusthöhe, Schultern unten halten, kontrolliert drücken.','Schultern hochgezogen, Arme ganz durchgeschlagen.'],
pike:['Hüfte hoch wie beim Hund, Kopf zwischen die Arme senken, Schultern drücken nach oben.','Rücken rund, Ellbogen weit außen.'],
sh_kh:['Rumpf angespannt, Hanteln über den Kopf drücken, ohne Schwung strecken.','Hohlkreuz, Gewicht mit Schwung hochgeworfen.'],
sh_lh:['Gesäß und Bauch fest, Stange am Gesicht vorbei nach oben drücken.','Starkes Hohlkreuz, Handgelenke geknickt.'],
sh_s:['Ellbogen leicht gebeugt, bis Schulterhöhe heben, oben kurz halten, langsam ablassen.','Mit Schwung aus dem Rücken, Schultern hochgezogen.'],
sh_sk:['Wie Seitheben mit Hanteln, gleichmäßiger Zug, Schulter bleibt unten.','Zu schwer, Oberkörper schwingt.'],
fpl:['Seil oder Band auf Gesichtshöhe, zum Gesicht ziehen, Ellbogen hoch, Schulterblätter zusammen.','Zu schwer, Nacken verspannt.'],
hand:['Nur mit Wandkontakt und freiem Platz, kontrolliert absenken, Kopf Richtung Boden.','Zu tief ohne Kontrolle, Hohlkreuz.'],
dip:['Hände auf stabilen Stühlen oder Barren, Ellbogen nach hinten, nur so tief, wie es schmerzfrei geht.','Schultern hängen nach vorn, wackelige Stühle.'],
dia:['Hände unter der Brust zum Dreieck, Ellbogen eng am Körper, volle Bewegung.','Ellbogen fallen nach außen.'],
tri_u:['Hantel hinter dem Kopf, Oberarme nah am Kopf lassen, nur die Unterarme bewegen.','Ellbogen weit außen, Rücken überstreckt.'],
tri_k:['Ellbogen fest am Körper, nach unten strecken, Handgelenke gerade.','Schultern gehen mit, zu viel Schwung.'],
skull:['Ellbogen zeigen zur Decke, Stange zur Stirn senken, kontrolliert strecken.','Ellbogen wandern nach außen, zu viel Gewicht.'],
klim:['Schulterblätter zuerst nach unten ziehen, Kinn über die Stange, kontrolliert ablassen.','Mit Schwung zappeln, Arme unten nicht ganz strecken.'],
chin:['Handflächen zu dir, schulterbreit greifen, Brust zur Stange ziehen.','Halbe Wiederholungen, Schwung.'],
klim_n:['Hochspringen oder Stuhl nutzen, oben halten, 3-5 Sek. langsam ablassen.','Fallen lassen statt abbremsen.'],
latz:['Brust raus, Ellbogen nach unten und hinten ziehen, Griff zur oberen Brust.','Mit dem Oberkörper schaukeln.'],
row_k:['Rücken gerade, Griff zum Bauchnabel ziehen, Schulterblätter zusammendrücken.','Rundrücken, Schultern hochgezogen.'],
row_kh:['Eine Hand stützen, Rücken parallel zum Boden, Hantel zur Hüfte ziehen, Ellbogen eng.','Oberkörper dreht auf, Hantel baumelt.'],
row_lh:['Hüfte nach hinten, Rücken gerade, Stange zum Bauch ziehen.','Rücken rund, zu viel Schwung.'],
row_g:['Brust am Polster, Griffe zur Taille ziehen, Schulterblätter zusammen.','Rücken schaukelt.'],
rfly:['Leicht vorgebeugt, Arme seitlich bis Schulterhöhe heben, Rücken gerade.','Schwung, Schultern hochgezogen.'],
row_t:['Unter einen sehr stabilen Tisch legen, Brust zur Tischkante ziehen, Körper bleibt gerade.','Wackeliger Tisch, Hüfte sackt durch.'],
super:['Arme und Beine gleichzeitig heben, Blick zum Boden, oben 2 Sek. halten.','Kopf in den Nacken, zu schnell.'],
curl:['Oberarme fest am Körper, Hantel bis zur Schulter, oben anspannen, langsam ablassen.','Mit Schwung aus dem Rücken curlen.'],
ham:['Handflächen zueinander, Oberarme am Körper, kontrolliert hoch und runter.','Ellbogen schwingen nach vorn.'],
curl_k:['Ellbogen fest am Körper, gleichmäßiger Zug, oben kurz anspannen.','Zu schwer, der Rücken hilft mit.'],
curl_l:['Mit leicht gebeugten Knien stehen, Stange kontrolliert zur Brust.','Hüfte schiebt mit.'],
curl_r:['Rucksack mit beiden Händen am Henkel, kontrolliert curlen.','Schwung aus dem Rücken.'],
sq:['Füße schulterbreit, Knie folgen den Zehen, Rücken gerade, bis die Oberschenkel waagerecht sind.','Knie fallen nach innen, Fersen heben ab.'],
gob:['Hantel vor der Brust, Ellbogen innen, tief in die Hocke, Brust aufrecht.','Rundrücken, Fersen heben ab.'],
bss:['Hinterer Fuß auf einem Stuhl, vorderes Bein trägt, Oberkörper aufrecht, tief runter.','Zu nah oder zu weit vom Stuhl, Knie kippt nach innen.'],
lunge:['Großer Schritt, hinteres Knie fast zum Boden, Oberkörper aufrecht, über die Ferse hoch.','Schritt zu klein, Knie kippt nach innen.'],
sq_l:['Stange fest auf dem oberen Rücken, Spannung im Bauch, bis die Oberschenkel waagerecht sind.','Rücken rund, Knie nach innen.'],
sq_r:['Rucksack vor der Brust oder auf dem Rücken, tiefe Hocke, Rücken gerade.','Rucksack rutscht, Oberkörper kippt vor.'],
pist:['An einer Stütze festhalten, langsam auf einem Bein absenken, Ferse bleibt am Boden.','Kein Halt, Knie fällt nach innen.'],
lpress:['Füße schulterbreit, Knie Richtung Zehen, nicht ganz durchstrecken, Rücken am Polster.','Hintern hebt ab, Knie durchgedrückt.'],
rdl:['Knie leicht gebeugt, Hüfte nach hinten schieben, Hanteln nah am Körper, Rücken gerade.','Rundrücken, Hanteln weg vom Körper.'],
dl:['Stange nah am Schienbein, Brust raus, Rücken gerade, mit Beinen und Hüfte hochdrücken.','Rundrücken, Stange zu weit weg.'],
bridge:['Fersen nah am Hintern, Hüfte hochdrücken, oben das Gesäß 1-2 Sek. anspannen.','Hohlkreuz, Gesäß nicht angespannt.'],
hipt:['Schulter auf Bank oder Sofa, ein Bein gestreckt, Hüfte hoch bis der Körper eine Linie bildet.','Hüfte dreht auf, Hohlkreuz.'],
lcurl:['Hüfte am Polster, Fersen zum Gesäß ziehen, kontrolliert zurück.','Hüfte hebt ab.'],
calf:['Ganz hoch auf die Fußballen, oben 1 Sek. halten, langsam ganz runter, an der Wand abstützen.','Federn statt volle Bewegung.'],
lr:['Rücken flach am Boden, Beine gestreckt langsam heben und senken, unterer Rücken bleibt unten.','Hohlkreuz, Beine fallen nur runter.'],
hlr:['Schultern nach unten, Beine gestreckt heben, kein Schaukeln.','Schwung, Rundrücken.'],
crunch:['Kinn leicht an der Brust, Oberkörper nur wenig einrollen, Bauch fest anspannen.','Mit den Händen am Nacken ziehen.'],
side:['Auf der Seite liegen, Oberkörper seitlich einrollen, Hüfte bleibt am Boden.','Schwung statt Spannung.'],
toe:['Auf dem Rücken, Beine nach oben, mit den Händen abwechselnd die Zehen berühren, Bauch fest.','Nacken zieht, zu schnell.'],
mtn:['Hände unter den Schultern, Körper gerade, Knie abwechselnd zur Brust ziehen.','Hüfte hoch, Hände zu weit weg.'],
plank:['Ellbogen unter den Schultern, Körper eine Linie, Bauch und Gesäß fest.','Hängende Hüfte, Atem anhalten.'],
roll:['Aus dem Knien rollen, Rücken rund und Bauch fest, nur so weit, wie du zurückkommst.','Hohlkreuz, zu weit rausrollen.'],
cabc:['Seil hinter dem Kopf, Oberkörper einrollen, Hüfte bleibt ruhig.','Mit den Armen ziehen statt mit dem Bauch.']
};
const FA=['Ganzkörper A','Beine · Brust · Rücken',[['quad',1],['brust',1],['rueckenV|rueckenH',1],['hintere',1],['schulter',1],['core',1]]];
const FB=['Ganzkörper B','Beine · Brust · Rücken',[['quad',1],['brust',1],['rueckenV|rueckenH',1],['hintere',1],['schulter',1],['core',1]]];
const PUSH=['Push','Brust · Schultern · Trizeps',[['brust',2],['schulter',2],['trizeps',2]]];
const PULL=['Pull','Rücken · Bizeps · Core',[['rueckenV|rueckenH',2],['rueckenH',1],['bizeps',2],['core',1]]];
const LEGS=['Beine + Core','Beine · Waden · Bauch',[['quad',2],['hintere',2],['waden',1],['core',2]]];
const MIX=['Oberkörper-Mix','Breite · Arme · Bauch',[['rueckenV|rueckenH',1],['brust',1],['schulter',1],['bizeps',1],['trizeps',1],['core',2]]];
const ARMS=['Arme + Core','Arme · Schultern · Bauch',[['bizeps',2],['trizeps',2],['schulter',1],['core',2]]];
const TPL={1:[FA],2:[FA,FB],3:[PUSH,PULL,LEGS],4:[PUSH,PULL,LEGS,MIX],5:[PUSH,PULL,LEGS,MIX,ARMS],6:[PUSH,PULL,LEGS,PUSH,PULL,LEGS]};
// [Name, Kcal, Protein, Kohlenhydrate, Fett]
const PRESETS=[['Ei',80,6,1,5],['Skyr 250 g',160,27,10,1],['Milch 250 ml',160,8,12,9],['Haferflocken+Banane+Erdnussb.',650,22,85,22],['Teller Reis+Hähnchen',750,45,90,14],['Teller Nudeln',700,25,120,12],['Erdnussbutter 2 EL',190,8,6,16],['Quark 250 g',170,30,10,1],['Brot (2 Scheiben)+Käse',350,15,38,14],['Nüsse 40 g',250,7,5,22]];
// Ränge: Name, ab XP, Buchstabe, Farben, Spruch
const RANKS=[
{n:'Sterblicher',xp:0,g:'Α',c:['#aab0b6','#5d636a'],t:'Jeder Koloss fängt klein an.'},
{n:'Athlet',xp:400,g:'Β',c:['#e0a872','#8a5a2e'],t:'Du bist im Rhythmus.'},
{n:'Hoplit',xp:2000,g:'Γ',c:['#efc38d','#a06f38'],t:'Dein Schild steht.'},
{n:'Spartaner',xp:6000,g:'Δ',c:['#e3e9ee','#7d878f'],t:'Disziplin schlägt Talent.'},
{n:'Halbgott',xp:14000,g:'Ε',c:['#f2cf93','#b7863f'],t:'Die Stärke ist sichtbar.'},
{n:'Titan',xp:28000,g:'Ζ',c:['#9fd3c5','#3f7d6e'],t:'Du formst dich wie Stein.'},
{n:'Olympier',xp:50000,g:'Η',c:['#f8edcf','#c9a45a'],t:'Fast unerreichbar.'},
{n:'Adonis',xp:80000,g:'Θ',c:['#fff6e0','#e8c08a'],t:'Die Statue lebt.'}
];
