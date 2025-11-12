# 🔧 Railway + Vercel Deployment Troubleshooting Guide

## Current Setup
- **Frontend (Vercel)**: Your website UI
- **Backend (Railway)**: ML model API
- **API URL**: `https://ml-preduction-model-production.up.railway.app/predict`

---

## ✅ Step-by-Step Debugging

### Step 1: Test Railway API Directly

Open the test page to check if Railway API is working:
- Deploy the updated code to Vercel (includes `test-api.html`)
- Visit: `https://your-vercel-app.vercel.app/test-api.html`
- Click "Test API Connection"

**OR** use this PowerShell command:

```powershell
# Test Railway API
$body = @{ text = "This is a test review" } | ConvertTo-Json
Invoke-WebRequest -Uri "https://ml-preduction-model-production.up.railway.app/predict" -Method POST -ContentType "application/json" -Body $body | Select-Object StatusCode, Content
```

### Step 2: Check Railway Logs

1. Go to [Railway Dashboard](https://railway.app/dashboard)
2. Select your project
3. Click on **Deployments** tab
4. Check **Logs** for errors

**Common issues in logs:**
- `Model not found` → model.pkl not uploaded
- `Module not found` → missing dependency in requirements.txt
- `Port binding error` → wrong start command

### Step 3: Verify Railway Environment

Check if these are correct in Railway:

**Settings → Environment Variables:**
- `PORT` should be automatically set by Railway
- No need to manually set it

**Settings → Deploy:**
- **Start Command**: `uvicorn app:app --host 0.0.0.0 --port $PORT`
- **Build Command**: Leave empty (auto-detected)

### Step 4: Test CORS

Open browser console on your Vercel site (F12) and check for CORS errors:

**If you see:**
```
Access to fetch at 'https://ml-preduction-model-production.up.railway.app/predict' 
from origin 'https://your-site.vercel.app' has been blocked by CORS policy
```

**Solution:** CORS is already set to `allow_origins=["*"]` in your app.py, so this shouldn't happen. If it does, redeploy Railway.

### Step 5: Check Railway Deployment Status

```powershell
# Check if Railway API root endpoint is accessible
Invoke-WebRequest -Uri "https://ml-preduction-model-production.up.railway.app/" | ConvertFrom-Json
```

Should return:
```json
{
  "message": "AI Rating Predictor API is running!",
  "status": "healthy",
  "model_loaded": true
}
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "Backend unavailable" error
**Cause:** Railway app is sleeping (free tier sleeps after inactivity)

**Solution:**
- First request takes 30-60 seconds to wake up
- Try again after waiting
- Or upgrade to Railway Pro ($5/month for always-on)

### Issue 2: CORS Error
**Cause:** Railway not allowing Vercel domain

**Solution:**
```python
# In app.py, update CORS to explicitly include your Vercel domain:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "*",
        "https://your-vercel-app.vercel.app",
        "https://*.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue 3: 404 Not Found on /predict
**Cause:** Railway not routing correctly

**Solution:** Check Railway logs and verify:
1. `app.py` is in root directory
2. Start command is correct: `uvicorn app:app --host 0.0.0.0 --port $PORT`

### Issue 4: 500 Internal Server Error
**Cause:** Model loading failed or prediction error

**Solution:**
1. Check Railway logs for error details
2. Verify `model.pkl` is uploaded to Railway
3. Check model file size (Railway free tier: 512MB limit)

### Issue 5: Request Timeout
**Cause:** Large model taking too long to load/predict

**Solution:**
1. Optimize model size
2. Use model caching
3. Increase Railway timeout settings

---

## 🔄 Redeploy Checklist

If you made changes, redeploy to both platforms:

### Push to GitHub (triggers auto-deploy on both):
```powershell
git add .
git commit -m "Fix: Railway API integration with updated CORS and logging"
git push origin main
```

### Verify Deployments:
- **Railway**: Check deployment status in dashboard
- **Vercel**: Check deployment status in dashboard
- Both should auto-deploy from GitHub push

---

## 🧪 Manual API Test

Test Railway API with this curl equivalent in PowerShell:

```powershell
$headers = @{
    "Content-Type" = "application/json"
}
$body = @{
    text = "This product is amazing and works perfectly!"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "https://ml-preduction-model-production.up.railway.app/predict" -Method POST -Headers $headers -Body $body

Write-Host "Rating: $($response.rating)"
Write-Host "Confidence: $($response.confidence)%"
Write-Host "Sentiment: $($response.sentiment)"
```

Expected output:
```
Rating: 5
Confidence: 99.95%
Sentiment: Highly Positive
```

---

## 📊 Debugging with Browser Console

On your Vercel site, open browser console (F12) and run:

```javascript
// Test API directly from browser console
fetch('https://ml-preduction-model-production.up.railway.app/predict', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: 'Test review' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## 🎯 Next Steps

1. ✅ Push updated code with Procfile and railway.json
2. ✅ Check Railway deployment logs
3. ✅ Test API using test-api.html
4. ✅ Check browser console for detailed errors
5. ✅ Redeploy if needed

---

## 💡 Pro Tips

1. **Railway Sleeping**: First request after inactivity takes 30-60 seconds
2. **Model Size**: Keep model.pkl under 100MB for faster cold starts
3. **Logging**: Railway logs are your best friend for debugging
4. **HTTPS**: Railway provides HTTPS automatically
5. **Health Checks**: Use the `/` endpoint to verify API is running

---

## 🆘 Still Not Working?

Share the following for better debugging:
1. Screenshot of Railway logs
2. Browser console errors (F12 → Console tab)
3. Network tab showing the failed request (F12 → Network)
4. Railway deployment URL and status
