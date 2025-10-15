const {createClient} = require('@supabase/supabase-js');

const s = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Realistic DSA sales call transcript (Dropship Academy prospect call)
const testTranscript = `Sales Rep: Hey! Goedemiddag, fijn dat je er bent. Hoe gaat het met je?

Lead: Hey, ja goed hoor. Een beetje druk, maar goed.

Sales Rep: Ah ja, ik snap het. Voordat we beginnen, wil ik even kort bespreken wat je vandaag kan verwachten. Is dat oké?

Lead: Ja, tuurlijk.

Sales Rep: Top! Dus we hebben ongeveer 30-45 minuten, en wat ik graag wil doen is eerst echt goed begrijpen waar je nu staat - je huidige situatie, wat er speelt, waar je tegenaan loopt. Daarna kijken we naar waar je heen wilt, je doelen. En als dat allemaal helder is, dan kunnen we kijken of en hoe wij je daarbij kunnen helpen. Maar het allerbelangrijkste is dat JIJ aan het einde van dit gesprek helder hebt of dit iets voor je is of niet. Klinkt dat goed?

Lead: Ja, perfect.

Sales Rep: Mooi! En als op een bepaald moment blijkt dat het niet matcht, dan zeggen we dat gewoon eerlijk tegen elkaar. No hard feelings. Deal?

Lead: Deal, sounds good.

Sales Rep: Nice! Oké, vertel eens - wat is er precies aan de hand op dit moment? Waarom heb je dit gesprek ingepland?

Lead: Nou, ik werk nu al 5 jaar in een 9-to-5 baan, en ik merk gewoon dat ik er helemaal klaar mee ben. Ik zit elke dag op kantoor, doe werk waar ik eigenlijk niks om geef, en ik verdien maar 2500 euro per maand. Dat is gewoon te weinig.

Sales Rep: Oké, 5 jaar al. Dat is best lang. En je zegt dat je er klaar mee bent - wat bedoel je daar precies mee? Wat maakt het zo vervelend?

Lead: Nou, het is gewoon... saai. Ik doe elke dag hetzelfde. En ik zie geen toekomst erin. Er is geen groei, geen vooruitgang.

Sales Rep: Hmm, ik hoor je. Maar help me even - want "saai" kan veel dingen betekenen. Wat maakt het voor jou saai? Is het het werk zelf, of de mensen, of...?

Lead: Het werk zelf vooral. Ik doe administratief werk, invoeren van data, rapportages maken. Het is gewoon heel repetitief.

Sales Rep: Oké, dus je zit vooral met repetitief werk. En je zei net ook dat je geen groei ziet - wat bedoel je daarmee? Heb je geprobeerd om promotie te maken, of...?

Lead: Ja, ik heb vorig jaar gevraagd om een salarisverhoging, maar mijn baas zei dat het er gewoon niet inzit. Budget constraints en zo. En promotiekansen zijn er eigenlijk ook niet echt.

Sales Rep: Ah man, dat is frustrerend. Dus je hebt het wel geprobeerd, maar het werd afgewezen. Hoe voelde dat?

Lead: Ja, teleurstellend natuurlijk. Ik had er echt naar uitgekeken, dacht echt dat ik wel een verhoging zou krijgen na 4 jaar trouw dienst. Maar nee.

Sales Rep: Ik kan me voorstellen dat dat pijn doet. En wat deed je daarna? Heb je toen direct gedacht: ik moet hier weg?

Lead: Niet meteen, maar het zaaide wel een zaadje. Ik begon toen meer te kijken naar andere opties, wat er nog meer mogelijk is.

Sales Rep: En toen kwam je dropshipping tegen, neem ik aan?

Lead: Ja, exact. Ik zag een advertentie op Instagram, en het sprak me meteen aan. Online geld verdienen, je eigen tijd indelen, geen baas meer.

Sales Rep: Nice! En wat triggerde je het meest? Was het de vrijheid, het geld, of iets anders?

Lead: Allebei eigenlijk. Maar vooral de vrijheid denk ik. Ik wil niet meer elk weekend uitkijken naar maandag en denken: fuck, alweer 5 dagen werken.

Sales Rep: Ja, dat gevoel ken ik. Vertel eens, als je nu naar de toekomst kijkt - wat wil je dan echt bereiken? Wat is je ideale situatie?

Lead: Ik wil financieel vrij zijn. Genoeg verdienen zodat ik niet meer hoef te stressen over geld. En ik wil mijn eigen tijd kunnen indelen.

Sales Rep: Oké, financieel vrij. Wat betekent dat voor jou in getallen? Hoeveel wil je verdienen?

Lead: Uhm, geen idee eigenlijk. Gewoon... genoeg?

Sales Rep: Haha, ik snap het. Maar "genoeg" is voor iedereen anders. Voor de een is 3000 euro per maand genoeg, voor de ander is 10.000 euro niet genoeg. Wat is het voor jou?

Lead: Oh ja, goed punt. Ik denk... 5000 euro per maand zou al mooi zijn om mee te beginnen.

Sales Rep: Top! En waar zou je dan van die 5000 euro aan besteden, of wat zou je ermee willen doen?

Lead: Nou, ik wil gewoon wat meer kunnen sparen. Misschien een auto kopen, vaker op vakantie. En uiteindelijk een huis kopen.

Sales Rep: Klinkt goed! En zie je jezelf dan nog steeds 40 uur per week werken, of...?

Lead: Nee, eigenlijk niet. Ik zou het liefst halftime werken, of gewoon mijn eigen uren bepalen.

Sales Rep: Mooi. Dus als ik het goed begrijp: je wilt 5000 euro per maand verdienen, je eigen tijd indelen, meer sparen, en uiteindelijk een huis kopen. Klopt dat?

Lead: Ja, precies!

Sales Rep: Perfect! Oké, dus nu weet ik waar je vandaan komt en waar je naartoe wilt. Nu de vraag: wat heb je tot nu toe al gedaan om daar te komen?

Lead: Nou, ik heb wat YouTube video's gekeken over dropshipping, en ik heb een aantal gratis cursussen gevolgd.

Sales Rep: Oké, en heb je al een winkel opgezet, of producten geprobeerd te verkopen?

Lead: Nee, nog niet. Ik ben er eigenlijk nog niet aan begonnen, omdat ik niet goed weet waar ik moet starten.

Sales Rep: Ah, dus je zit een beetje vast in de 'analysis paralysis' fase, zeg maar?

Lead: Ja, zo kun je het wel zeggen, haha.

Sales Rep: Haha, no worries, dat hebben we allemaal wel eens. Maar goed, laat me je uitleggen hoe wij je kunnen helpen. Bij de Dropship Academy hebben we een compleet programma waarbij we je van A tot Z begeleiden. Van het opzetten van je winkel tot het vinden van winnende producten, het maken van advertenties, en het schalen van je business. En het mooie is: je hebt directe toegang tot coaches die je 1-op-1 kunnen helpen. Dus je staat er niet alleen voor.

Lead: Klinkt goed. En hoeveel kost dat dan?

Sales Rep: De investering is 2500 euro. En ik weet dat dat een bedrag is, maar bedenk: als je straks 5000 euro per maand verdient, dan heb je dat binnen een maand terug. En je kan ook in termijnen betalen als dat makkelijker is.

Lead: Hmm, 2500 euro... dat is best veel. Ik weet niet of ik dat heb.

Sales Rep: Ik snap het. Maar laat me je één ding vragen: als geld geen rol zou spelen, zou je het dan willen doen?

Lead: Ja, natuurlijk.

Sales Rep: Oké. Dus eigenlijk is het enige wat tussen jou en je doel staat, die 2500 euro?

Lead: Ja, eigenlijk wel.

Sales Rep: Dan wil ik je nog één ding vragen: hoeveel heb je de afgelopen 5 jaar geïnvesteerd in jezelf? In cursussen, coaching, of persoonlijke ontwikkeling?

Lead: Uhm... eigenlijk niks.

Sales Rep: Precies. En waar heeft dat je gebracht?

Lead: Nou... hier. Nog steeds in die 9-to-5 die ik haat.

Sales Rep: Exactly. Dus als je nu weer "nee" zegt tegen jezelf, waar ben je dan over een jaar?

Lead: Waarschijnlijk nog steeds op dezelfde plek.

Sales Rep: En wil je dat?

Lead: Nee, absoluut niet.

Sales Rep: Dus wat ga je doen?

Lead: Ik denk... ik denk dat ik het ga doen. Ik moet gewoon die sprong maken.

Sales Rep: Yes! Dat is de mindset! Oke, laten we dan even kijken naar de volgende stappen...`;

async function addTestTranscript() {
  console.log('🔍 Zoeken naar Milad Azizi...');

  // Get Milad's rep ID
  const {data: reps} = await s
    .from('sales_reps')
    .select('id, name, email')
    .eq('email', 'milad@splitty.nl');

  if (!reps || reps.length === 0) {
    console.log('❌ Geen sales rep gevonden met email milad@splitty.nl');
    return;
  }

  const rep = reps[0];
  console.log('✅ Sales Rep gevonden:', rep.name);

  // Get first call that's long enough (not the 30-second ones)
  const {data: calls} = await s
    .from('calls')
    .select('id, meeting_title, duration, transcript')
    .eq('rep_id', rep.id)
    .gte('duration', 400) // At least 7 minutes
    .order('date', {ascending: false})
    .limit(1);

  if (!calls || calls.length === 0) {
    console.log('❌ Geen calls gevonden langer dan 7 minuten');
    return;
  }

  const call = calls[0];
  console.log('');
  console.log('📞 Call geselecteerd:', call.meeting_title);
  console.log('   Duur:', Math.floor(call.duration / 60), 'minuten');
  console.log('   Huidige transcript lengte:', call.transcript?.length || 0, 'chars');
  console.log('');

  console.log('✍️  Toevoegen van DSA sales call transcript...');

  // Update call with test transcript
  const {error: updateError} = await s
    .from('calls')
    .update({
      transcript: testTranscript,
      customer_name: 'Test Prospect',
      customer_email: 'prospect@example.com'
    })
    .eq('id', call.id);

  if (updateError) {
    console.log('❌ Fout bij updaten:', updateError);
    return;
  }

  console.log('✅ Test transcript toegevoegd!');
  console.log('');
  console.log('━'.repeat(70));
  console.log('');
  console.log('🎉 SUCCESS! Je kan nu testen!');
  console.log('');
  console.log('VOLGENDE STAPPEN:');
  console.log('');
  console.log('1️⃣  Refresh je browser (F5)');
  console.log('');
  console.log('2️⃣  Ga naar: Dashboard → Klik op "Milad Azizi"');
  console.log('   (Niet de homepage, maar het PROFIEL van de sales rep!)');
  console.log('');
  console.log('3️⃣  Bij de call "' + call.meeting_title + '" zie je nu:');
  console.log('   → Paarse badge: "KLAAR VOOR ANALYSE"');
  console.log('   → Paarse knop: "✨ DSA Analyseer"');
  console.log('');
  console.log('4️⃣  Klik op die knop!');
  console.log('');
  console.log('5️⃣  Wacht 5-10 seconden (OpenAI analyseert met DSA framework)');
  console.log('');
  console.log('6️⃣  BOOM! Je ziet de DSA analyse:');
  console.log('   ✓ Overall score (0-100)');
  console.log('   ✓ Scores per 7 stappen');
  console.log('   ✓ Closer infections detected');
  console.log('   ✓ Coaching feedback als Matthijs');
  console.log('   ✓ Sales Spiegel reflectie');
  console.log('');
  console.log('━'.repeat(70));
  console.log('');
  console.log('📝 Deze test call bevat:');
  console.log('  - Goede Intro & Set Intention');
  console.log('  - Sterke Current stap (diepte in gaan)');
  console.log('  - Heldere Desired stap');
  console.log('  - Pathway met gap selling');
  console.log('  - Pitch met investering');
  console.log('  - Objection handling (prijs bezwaar)');
  console.log('');
  console.log('Perfect om de DSA analyse te testen! 🚀');
  console.log('');
}

addTestTranscript();
