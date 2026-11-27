-- 006_content_fixes: realistic job-linked skills (idempotent, admin rows untouched)
UPDATE learn_courses SET skills=ARRAY['व्हाट्सऐप ऑर्डर','ऑनलाइन फॉर्म','UPI भुगतान'] WHERE id='lc-smartphone';
UPDATE learn_courses SET skills=ARRAY['हिंदी टाइपिंग','फॉर्म भरना','बुनियादी अंग्रेजी'] WHERE id='lc-hindi-english';
UPDATE learn_courses SET skills=ARRAY['बचत खाता','UPI सुरक्षा','धोखा पहचान'] WHERE id='lc-finance-upi';
UPDATE learn_courses SET skills=ARRAY['ब्लाउज-सूट','मरम्मत','ग्राहक ऑर्डर'] WHERE id='lc-sewing';
UPDATE learn_courses SET skills=ARRAY['लागत-दाम','व्हाट्सऐप बिक्री','हिसाब'] WHERE id='lc-home-business';
UPDATE learn_courses SET skills=ARRAY['कैटलॉग','ऑर्डर प्रबंधन','ग्राहक सेवा'] WHERE id='lc-whatsapp-selling';
UPDATE learn_courses SET skills=ARRAY['बायोडाटा','इंटरव्यू','स्कैम पहचान'] WHERE id='lc-job-cv-interview';
UPDATE learn_courses SET skills=ARRAY['टाइपिंग','एक्सेल बेसिक','ईमेल'] WHERE id='lc-computer-office';
UPDATE learn_courses SET skills=ARRAY['अचार-पापड़','लागत-पैकेजिंग','FSSAI बेसिक'] WHERE id='lc-food-enterprise';
UPDATE learn_courses SET skills=ARRAY['थ्रेडिंग-फेशियल','सफाई-सुरक्षा','बुकिंग'] WHERE id='lc-beauty-salon';
UPDATE learn_courses SET skills=ARRAY['बचत रजिस्टर','सामूहिक बिक्री','बैंक लिंकेज'] WHERE id='lc-shg-bookkeeping';
UPDATE learn_courses SET skills=ARRAY['हेल्पलाइन 181/1930','स्कैम पहचान','शिकायत प्रक्रिया'] WHERE id='lc-rights-safety';
