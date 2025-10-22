## 2. CURL FOR CALLING ROTATE COOKIES

### 2.1. CURL Request for cookie rotate endpoint

```curl
curl 'https://accounts.google.com/RotateCookies' \
  -H 'accept: */*' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'content-type: application/json' \
  -b 'OTZ=8283307_84_88_104280_84_446940; SID=g.a0001whF7zBAyNmfCOCdqiplRk0guhP3hoD6zaLfjChbe6698owSS9-ZD8YPVIZnFc3HeoDKqQACgYKATQSARUSFQHGX2MiHe4IVo0YdBtmSOyf76h8mRoVAUF8yKpJ7s2jouVeGrb4sV4uA2sK0076; __Secure-1PSID=g.a0001whF7zBAyNmfCOCdqiplRk0guhP3hoD6zaLfjChbe6698owSZtvX243Ltn8hTDxZPM7pIAACgYKAXUSARUSFQHGX2MiNWt5G7_NDvviRCUW4xxKPBoVAUF8yKqC4jrh15-E0D9Cm4P1dEo80076; __Secure-3PSID=g.a0001whF7zBAyNmfCOCdqiplRk0guhP3hoD6zaLfjChbe6698owS89vmSdNnC32GUWORP2GTaAACgYKAS8SARUSFQHGX2Mi5eR6aCBTM8kEU1SgRuQpTRoVAUF8yKquJYMwEUlZUE2lPX_zqED-0076; HSID=Ak4EcFGoOit9OEs3G; SSID=AtakpPy_L2rFgWSgY; APISID=n8-f_FGgSwSzssYp/AoxBkiYAgv6d-bQBB; SAPISID=KUDZFCvnfwS2zDVe/Aqp4cZDoxMvtkWiA2; __Secure-1PAPISID=KUDZFCvnfwS2zDVe/Aqp4cZDoxMvtkWiA2; __Secure-3PAPISID=KUDZFCvnfwS2zDVe/Aqp4cZDoxMvtkWiA2; ACCOUNT_CHOOSER=AFx_qI6EvJvbVuvpQk4-YdtieBFy5VdFx2YFQsgsr_rCFlgxwcGXBlMQqffdfIsS1bDM3_Hpnp0gGB46e-D4iQ-J3KFz9yK_Xcff-DbCSTVo6oQOEMe4UcGUa3E6VgG29nUKYe5s14t6; SMSV=ADHTe-AHZgPBt2mtcS7U_9ZY0LehTPjvr77SfZ6Hsn3eIRjF8AZ985nhxaB6NQA-qexOmVCjBsaZpAnKv9v0CkjAw73TtVwQatcfaeUGhyiPb5gmuAYQxsw; LSID=o.admin.google.com|o.drive.google.com|o.drive.usercontent.google.com|o.mail.google.com|o.notebooklm.google.com|o.play.google.com|s.VN|s.youtube:g.a0001whF73UNm2cOHkpA363pBPCeovF6rBXhcQRxA9z7XIieDvI2LG2hK6x0fCbn9zDzh9CcdwACgYKAUISARUSFQHGX2MiELd6TEKtayOEM-UQ2Su6ChoVAUF8yKrhH8ED2Xid2cKjVvami2FW0076; __Host-1PLSID=o.admin.google.com|o.drive.google.com|o.drive.usercontent.google.com|o.mail.google.com|o.notebooklm.google.com|o.play.google.com|s.VN|s.youtube:g.a0001whF73UNm2cOHkpA363pBPCeovF6rBXhcQRxA9z7XIieDvI2xIGNbrz-Dbic1G4IuNVs8AACgYKAcMSARUSFQHGX2MiS3z6wC8mbl1Ehj7hGYSU4xoVAUF8yKrODCgZrTq5udK3xoCZJujH0076; __Host-3PLSID=o.admin.google.com|o.drive.google.com|o.drive.usercontent.google.com|o.mail.google.com|o.notebooklm.google.com|o.play.google.com|s.VN|s.youtube:g.a0001whF73UNm2cOHkpA363pBPCeovF6rBXhcQRxA9z7XIieDvI2EYo2AIxXkmfhkmUrXDlDoAACgYKAcASARUSFQHGX2MibV3Smqj1OmaAyt8Yu5QxMBoVAUF8yKpFLwU4tzYu-dVUybVuW51y0076; SEARCH_SAMESITE=CgQImJ8B; __Host-GAPS=1:J1jiUtRkfb3eyvz6VyW45l68B9ZjozwMRao-f6k1RVAwTrbrLzu_6vm15w96RzE1fP8eFVoU2ZT50kaQZsnWFeRQ8ywpaQ:Sv9Yh4vnL_MmTFGY; AEC=AaJma5vHgTjPr1i_k2_fsu32_Hf2p5IR1kS7FMeSCrnzntVNMq_atjuxxw; NID=525=NDD63BR5F_YjeMc6AEqNJwpuvd3BwEOKfZEdr_YXDTEoocZ-tCmmPUrE7BQJF2Goi-pFsZCS3J8qyu1DYV1mX31NDXhuhwWchdgSj2IhEPbh7c0LSBcNMIjw_NReQBEJk6E5Igk_F8GZBx5UXWksAxQW5N8ey4kWtKoNiPC9noHkEoT_Gt-6-JesqM-OOz7Bydmr0XJ_US6fygqDcAml3MxALlxNT23q4KecJIkklFsnXqydGJqVzqqgQtLQXRm5JzHhnFz1JCJf3R6wXrjpQCtIJk5bAx-l8gv0UAiRSrnUGX30laWu0MBSf4OGk4NVaimaoe7jLaBtv9iBzNwlrrS_HpuE5eX2OKsh8pEqzUtU-K77JTq8TL0riNh4lU7VSDeyXHUMO07q1Fo9WA6ezaG1b9L-IWYokylYVMCFmoY70b8_8cMQJTkZ2r4HP-HpN8WzJsvUfkhycspVSjaVQT3ZUq9o5nEh6fmNEIsyUHjviFNIOAOsb758iQcsSmbjRPnwkKr3g_l6ju6ghrDL9mxKway23n4ck3QOSG0W7a4LAlPF0tz65E1SgG3zdpdyjI6TFMEE5xB71UiCbVwbP6QRDfXJT77Sc9KitMG0QSwO-Ay6lfP1hOD0wJ-nLweehxzcuqllXrGuW8UZmRbwohuiBAuJUp9tyGXPMDJNIw7SBLAGxbTgtJgKCFb-wmmDBM9Ie9mjaC0l3L0cT--JQrvuADPJG_Uce3FD7ZoQs26mGTflVgwxyzruc2tCByA; __Secure-1PSIDTS=sidts-CjIBmkD5S1DX0EpNrMNZ08ryljDAeDFsqoJqpUp9P1kLbpZquuOp7K7fSwdeBCD0-lyGghAA; __Secure-3PSIDTS=sidts-CjIBmkD5S1DX0EpNrMNZ08ryljDAeDFsqoJqpUp9P1kLbpZquuOp7K7fSwdeBCD0-lyGghAA; SIDCC=AKEyXzV-2GI1X4s0E1k73OtUWYXGyPuIznoEH8uU-K1KoTyqaz5Br7G6F1QwepnHHIdBQTrp0Q; __Secure-1PSIDCC=AKEyXzU_tDJ-1dg_2LQvIJQV9qxurDwKxdlcIVBjyGOsFC9GNQ25L_RMUJGsjMbZzajC1VK6GQ0; __Secure-3PSIDCC=AKEyXzU4nIjhSaB3cpagXW_pBy3jTeKLFYPQSKfEbWATOFEotwmCcYeTGEPKF29P0GGfJyfd98s' \
  -H 'origin: https://accounts.google.com' \
  -H 'priority: u=1, i' \
  -H 'referer: https://accounts.google.com/RotateCookiesPage?og_pid=658&rot=3&origin=https%3A%2F%2Fgemini.google.com&exp_id=0' \
  -H 'sec-ch-ua: "Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"' \
  -H 'sec-ch-ua-arch: "x86"' \
  -H 'sec-ch-ua-bitness: "64"' \
  -H 'sec-ch-ua-form-factors: "Desktop"' \
  -H 'sec-ch-ua-full-version: "141.0.7390.108"' \
  -H 'sec-ch-ua-full-version-list: "Google Chrome";v="141.0.7390.108", "Not?A_Brand";v="8.0.0.0", "Chromium";v="141.0.7390.108"' \
  -H 'sec-ch-ua-mobile: ?0' \
  -H 'sec-ch-ua-model: ""' \
  -H 'sec-ch-ua-platform: "Windows"' \
  -H 'sec-ch-ua-platform-version: "19.0.0"' \
  -H 'sec-ch-ua-wow64: ?0' \
  -H 'sec-fetch-dest: empty' \
  -H 'sec-fetch-mode: same-origin' \
  -H 'sec-fetch-site: same-origin' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36' \
  -H 'x-browser-channel: stable' \
  -H 'x-browser-copyright: Copyright 2025 Google LLC. All rights reserved.' \
  -H 'x-browser-validation: AGaxImjg97xQkd0h3geRTArJi8Y=' \
  -H 'x-browser-year: 2025' \
  -H 'x-chrome-id-consistency-request: version=1,client_id=77185425430.apps.googleusercontent.com,device_id=b2f8f4c7-7ce6-43ae-8b2b-bd3e12954bef,sync_account_id=101030405497942316112,signin_mode=all_accounts,signout_mode=show_confirmation' \
  -H 'x-client-data: CIS2yQEIorbJAQipncoBCPyVywEIlqHLAQiFoM0BCOjkzgEIy4vPAQiNjs8BCKiPzwEIkJHPAQj7ks8BCJqTzwEYs4bPARilh88BGJiIzwE=' \
  --data-raw '[658,"-6138212575597572520"]'
```

### 2.2. Response set-cookie header for the above curl:

```txt
set-cookie
__Secure-1PSIDTS=sidts-CjIBmkD5S3Pfo9QwPq0M98SLAs9bS6WkSQlR7f5FOkuQ8RdgSLo_4eyLq-xVsP-fByyDQhAA; Domain=.google.com; Expires=Thu, 22-Oct-2026 02:16:39 GMT; Path=/; Secure; HttpOnly; Priority=HIGH; SameParty
set-cookie
__Secure-3PSIDTS=sidts-CjIBmkD5S3Pfo9QwPq0M98SLAs9bS6WkSQlR7f5FOkuQ8RdgSLo_4eyLq-xVsP-fByyDQhAA; Domain=.google.com; Expires=Thu, 22-Oct-2026 02:16:39 GMT; Path=/; Secure; HttpOnly; Priority=HIGH; SameSite=none

set-cookie
SIDCC=AKEyXzWW5bi_mLDTK5ZyiXRDl1EUJj-FTLABgjwEldBYiUkylHUD6Ny44RsYPBn7OFDbw0eqPg; expires=Thu, 22-Oct-2026 02:16:39 GMT; path=/; domain=.google.com; priority=high
set-cookie
__Secure-1PSIDCC=AKEyXzV5ob7AKfOCUlBOkSwmGrfhs9HtNL1FpK4t4VTwONpxIFvZttZPr8bZE1LdEbqtF7QdL3Q; expires=Thu, 22-Oct-2026 02:16:39 GMT; path=/; domain=.google.com; Secure; HttpOnly; priority=high
set-cookie
__Secure-3PSIDCC=AKEyXzUr39BLg9wxvDb259HKMnM1gTUMJYjeA6SqUWTmbIt-ioIB8IJPY6rsiOZGgaRhJ-jWaN8; expires=Thu, 22-Oct-2026 02:16:39 GMT; path=/; domain=.google.com; Secure; HttpOnly; priority=high; SameSite=none
```

### 2.3. INTERVAL: **10 mins**

## 3.
