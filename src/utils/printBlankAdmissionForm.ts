export const printBlankAdmissionForm = () => {
  const win = window.open('', '_blank');
  if (!win) {
    alert('Please allow popups for printing.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
  <meta charset="UTF-8">
  <title>Admission Form</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Nastaliq+Urdu:wght@400;700&display=swap');
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background: white;
    }
    .form-container {
      width: 210mm;
      min-height: 297mm;
      padding: 10mm;
      box-sizing: border-box;
      margin: 0 auto;
    }
    .urdu {
      font-family: 'Noto Nastaliq Urdu', serif;
      direction: rtl;
    }
    .header {
      position: relative;
      text-align: center;
      margin-bottom: 20px;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      font-size: 14px;
      font-weight: bold;
    }
    .title-urdu {
      font-size: 32px;
      font-weight: bold;
      margin-top: 10px;
      line-height: 1.2;
    }
    .subtitle-urdu {
      font-size: 20px;
      margin-bottom: 10px;
    }
    .school-urdu {
      font-size: 28px;
      font-weight: bold;
    }
    .school-eng {
      font-size: 24px;
      font-weight: bold;
      margin-top: 10px;
      letter-spacing: 1px;
    }
    .address-eng {
      font-size: 14px;
      font-weight: bold;
    }
    .border-box {
      border: 2px solid black;
      padding: 15px;
      border-radius: 5px;
      position: relative;
    }
    .row {
      display: flex;
      margin-bottom: 15px;
      align-items: center;
      justify-content: space-between;
    }
    .row-rtl {
      display: flex;
      flex-direction: row-reverse;
      margin-bottom: 15px;
      align-items: center;
      justify-content: space-between;
    }
    .box-input {
      display: flex;
      gap: 2px;
    }
    .box {
      width: 20px;
      height: 25px;
      border: 1px solid #333;
    }
    .dotted-line {
      border-bottom: 1px dashed black;
      flex-grow: 1;
      margin: 0 10px;
    }
    .label-eng {
      font-size: 12px;
      font-weight: bold;
      width: 150px;
      flex-shrink: 0;
    }
    .label-urdu {
      font-size: 18px;
      font-weight: bold;
      white-space: nowrap;
    }
    .logo-placeholder {
      position: absolute;
      right: 10px;
      top: 50px;
      width: 80px;
      height: 80px;
      border: 1px solid black;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      text-align: center;
    }
    .photo-placeholder {
      position: absolute;
      left: 10px;
      top: 50px;
      width: 90px;
      height: 110px;
      border: 1px solid black;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      text-align: center;
    }
    .office-use {
      border: 2px solid black;
      margin-top: 20px;
      padding: 15px;
      border-radius: 5px;
      background-color: #f9f9f9;
    }
    .office-title {
      text-align: center;
      font-size: 20px;
      font-weight: bold;
      background: black;
      color: white;
      padding: 5px;
      border-radius: 15px;
      width: 200px;
      margin: -25px auto 10px auto;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="form-container border-box">
    <div class="header">
      <div class="header-top">
        <div>Session:- 20____ - 20____</div>
        <div style="text-align: right;" class="urdu">رکنیت نمبر: 4053<br><span style="font-family: Arial;">Regd No. G- 59313</span></div>
      </div>
      
      <div class="photo-placeholder">Affix<br>Photo<br>Here</div>
      <div class="logo-placeholder urdu">قائم شدہ<br>1973</div>

      <div class="title-urdu urdu">داخلہ فارم</div>
      <div class="subtitle-urdu urdu">مکتب</div>
      <div class="school-urdu urdu">مدرسہ عربیہ نورالعلوم کرماں خان ضلع سنت کبیر نگر(یوپی)</div>
      <div class="school-eng">MADARSA ARABIA NOORUL ULOOM</div>
      <div class="address-eng">Vill. & Post Karma Khan Distt: Sant Kabir Nagar, (U.P.) - 272126</div>
    </div>

    <!-- Urdu Section -->
    <div style="margin-top: 40px;">
      <div class="row-rtl urdu">
        <div style="display: flex; align-items: center;">
          <div class="label-urdu">فارم نمبر</div>
          <div style="width: 100px; border-bottom: 1px solid black; margin-right: 10px;"></div>
        </div>
        <div style="display: flex; align-items: center; gap: 20px;">
          <div><input type="checkbox"> جدید (New)</div>
          <div><input type="checkbox"> قدیم (Old)</div>
        </div>
      </div>

      <div class="row-rtl urdu">
        <div class="label-urdu">نام طالب علم / طالبہ</div>
        <div class="dotted-line"></div>
      </div>

      <div class="row-rtl urdu">
        <div class="label-urdu">والد کا نام</div>
        <div class="dotted-line"></div>
        <div class="label-urdu">والدہ کا نام</div>
        <div class="dotted-line"></div>
      </div>

      <div class="row-rtl urdu">
        <div class="label-urdu">مکمل پتہ</div>
        <div class="dotted-line"></div>
      </div>

      <div class="row-rtl urdu" style="margin-top: 20px;">
        <div class="label-urdu" style="width: 120px;">تاریخ پیدائش</div>
        <div class="box-input" style="margin-left: auto;">
          ${Array(8).fill('<div class="box"></div>').join('')}
        </div>
        
        <div class="label-urdu" style="width: 120px; margin-right: 40px;">آدھار نمبر</div>
        <div class="box-input" style="margin-left: auto;">
          ${Array(12).fill('<div class="box"></div>').join('')}
        </div>
      </div>

      <div class="row-rtl urdu">
        <div class="label-urdu" style="width: 120px;">موبائل نمبر</div>
        <div class="box-input" style="margin-left: auto;">
          ${Array(10).fill('<div class="box"></div>').join('')}
        </div>
        
        <div class="label-urdu" style="width: 120px; margin-right: 40px;">واٹس ایپ نمبر</div>
        <div class="box-input" style="margin-left: auto;">
          ${Array(10).fill('<div class="box"></div>').join('')}
        </div>
      </div>
    </div>

    <!-- English Section -->
    <div style="margin-top: 40px;">
      <div class="row">
        <div class="label-eng">Student's Name<br><span style="font-weight:normal">(Male / Female):<br>(In Capital Letters)</span></div>
        <div class="box-input" style="flex-wrap: wrap; gap: 5px;">
          ${Array(25).fill('<div class="box"></div>').join('')}
        </div>
      </div>

      <div class="row">
        <div class="label-eng">Father's Name<br><span style="font-weight:normal">(In Capital Letters)</span></div>
        <div class="box-input" style="flex-wrap: wrap; gap: 5px;">
          ${Array(25).fill('<div class="box"></div>').join('')}
        </div>
      </div>

      <div class="row">
        <div class="label-eng">Mother's Name<br><span style="font-weight:normal">(In Capital Letters)</span></div>
        <div class="box-input" style="flex-wrap: wrap; gap: 5px;">
          ${Array(25).fill('<div class="box"></div>').join('')}
        </div>
      </div>

      <div class="row" style="margin-top: 20px;">
        <div class="label-eng" style="width: 80px;">Village</div>
        <div class="box-input">${Array(12).fill('<div class="box"></div>').join('')}</div>
        <div class="label-eng" style="width: 50px; text-align: right; margin-right: 10px;">Post</div>
        <div class="box-input">${Array(10).fill('<div class="box"></div>').join('')}</div>
      </div>

      <div class="row">
        <div class="label-eng" style="width: 80px;">Distt</div>
        <div class="box-input">${Array(12).fill('<div class="box"></div>').join('')}</div>
        <div class="label-eng" style="width: 50px; text-align: right; margin-right: 10px;">State</div>
        <div class="box-input">${Array(10).fill('<div class="box"></div>').join('')}</div>
      </div>

      <div class="row">
        <div class="label-eng" style="width: 80px;">Country:</div>
        <div class="box-input">
          <div class="box" style="text-align: center; font-weight: bold; line-height: 25px;">I</div>
          <div class="box" style="text-align: center; font-weight: bold; line-height: 25px;">N</div>
          <div class="box" style="text-align: center; font-weight: bold; line-height: 25px;">D</div>
          <div class="box" style="text-align: center; font-weight: bold; line-height: 25px;">I</div>
          <div class="box" style="text-align: center; font-weight: bold; line-height: 25px;">A</div>
        </div>
        <div class="label-eng" style="width: 100px; text-align: right; margin-right: 10px;">Pin Code</div>
        <div class="box-input">${Array(6).fill('<div class="box"></div>').join('')}</div>
      </div>
    </div>

    <!-- Bottom Urdu Section -->
    <div style="margin-top: 40px;" class="urdu">
      <div class="row-rtl">
        <div class="label-urdu">پہلے مدرسہ/اسکول کا نام و پتہ</div>
        <div class="dotted-line"></div>
      </div>
      
      <div class="row-rtl">
        <div class="label-urdu">مطلوبہ درجہ</div>
        <div class="dotted-line"></div>
      </div>

      <div class="row-rtl" style="margin-top: 30px;">
        <div class="label-urdu" style="font-size: 14px;">یہ تمام معلومات درست لکھی گئی ہیں</div>
        <div class="label-urdu">دستخط والدین/سرپرست:</div>
        <div class="dotted-line" style="width: 150px; flex-grow: 0;"></div>
        <div class="label-urdu">دستخط طالب علم و طالبہ:</div>
        <div class="dotted-line" style="width: 150px; flex-grow: 0;"></div>
      </div>
    </div>

    <!-- Office Use -->
    <div class="office-use urdu">
      <div class="office-title">دفتری کاروائی کے لئے</div>
      
      <div class="row-rtl" style="margin-top: 20px;">
        <div class="label-urdu">مندرجہ بالا تصریحات کے مطابق طالب علم / طالبہ کا نام درجہ</div>
        <div class="dotted-line" style="width: 150px; flex-grow: 0;"></div>
        <div class="label-urdu">سیکشن</div>
        <div class="dotted-line" style="width: 100px; flex-grow: 0;"></div>
        <div class="label-urdu">میں لکھنے کی منظوری دی گئی</div>
      </div>

      <div class="row-rtl" style="margin-top: 40px;">
        <div class="label-urdu">دستخط ناظم تعلیمات مع تاریخ</div>
        <div class="dotted-line" style="width: 200px; flex-grow: 0;"></div>
      </div>
    </div>
  </div>
</body>
</html>
  `;
  
  win.document.write(html);
  win.document.close();
  
  setTimeout(() => {
    win.print();
  }, 1000); // Give enough time for the Urdu font to load
};
