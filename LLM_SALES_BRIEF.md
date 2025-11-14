# LLM Usage & Requirements
**For Sales/Provider Discussions**

---

## What We Built
**AI-powered visa interview simulation platform** where students practice USA F1, UK Student, and France visa interviews with an AI interviewer that provides real-time scoring and feedback.

---

## Current Usage

### **Scale**
- **Daily Active Users**: 50-200 students
- **Daily Interviews**: 100-500 interviews
- **Peak Hours**: 6-10 PM across multiple time zones (India, UK, US)
- **Interview Duration**: 15-20 minutes each

### **Current Pain Points**
- **Rate Limits**: Hitting Gemini free tier limits (60 RPM, 115-136 interviews/day)
- **Getting 429 errors** during peak hours
- **Slow responses**: 2-3 seconds causing poor user experience

---

## How We Use LLM

### **Primary Use Case: Real-time Interview Scoring**
- **Frequency**: 12-15 API calls per interview (one per student answer)
- **Input**: Student answer + conversation context + scoring rubric
- **Output**: Structured JSON with scores on 7 dimensions + feedback
- **Latency Requirement**: <3 seconds (students are waiting)
- **Consistency**: Critical - must score fairly across all students

### **Secondary Use Case: Final Interview Evaluation**
- **Frequency**: 1 call per interview (at the end)
- **Input**: Complete interview transcript
- **Output**: Overall decision (accept/reject) + summary
- **Latency Requirement**: <5 seconds (acceptable)

### **Token Usage Per Interview**
- **Total**: ~60,000-75,000 tokens per interview
- **Input/Output Ratio**: ~75% input, 25% output
- **Context Needed**: 4,000-6,500 tokens per request

---

## Technical Requirements

### **Must-Have**
✅ **JSON Mode**: Structured output (not markdown-wrapped)  
✅ **Context Window**: 8K+ tokens minimum  
✅ **Temperature Control**: 0.3 for consistent scoring  
✅ **Latency**: <3 seconds per request  
✅ **Reliability**: 95%+ uptime  

### **Rate Limits Needed**

| Scale | Timeline | RPM Needed | TPM Needed | Daily Interviews |
|-------|----------|------------|------------|-----------------|
| **Current** | Now | 200-500 | 800K-2M | 100-500 |
| **Growth** | 6 months | 1K-2.5K | 4M-15M | 1K-5K |
| **Scale** | 12 months | 5K-10K | 20M-60M | 5K-20K |

---

## Budget & Cost Expectations

### **Current Constraint**
Using **Gemini free tier** but hitting limits. Need paid solution.

### **Target Cost**
- **Per Interview**: $0.002-0.01 acceptable
- **Monthly Budget**: 
  - Phase 1: $200-1,000/month
  - Phase 2: $1,000-5,000/month
  - Phase 3: $5,000-15,000/month

### **ROI Context**
- **Customer LTV**: ~$100
- **Current LLM cost**: <1% of customer value
- **Main goal**: Remove rate limit bottlenecks to grow

---

## What We're Looking For

### **Primary Goals**
1. **Eliminate rate limit issues** during peak hours
2. **Faster response times** for better user experience
3. **Predictable costs** as we scale
4. **Reliable service** with good uptime

### **Questions for Sales Team**
1. What **rate limits** do you offer at different pricing tiers?
2. What's your **average response latency** for JSON mode requests?
3. Do you have **volume discounts** for high token usage?
4. What's your **SLA/uptime guarantee**?
5. Do you offer **dedicated capacity** or **priority queuing**?
6. What's your **support response time** for technical issues?

### **Evaluation Criteria**
- **Rate limits** that can handle our peak traffic
- **Cost per token** (especially output tokens)
- **Latency** and reliability
- **JSON mode quality** and consistency
- **Scaling path** as we grow

---

## Technical Integration

### **Current Setup**
- **Primary**: Gemini API
- **Fallback**: OpenRouter (Llama models)
- **Final Fallback**: Heuristic scoring

### **API Compatibility**
- **Preferred**: OpenAI-compatible format (easier migration)
- **Can adapt**: Custom API formats
- **Integration timeline**: 1-2 weeks for testing

---

## Next Steps

1. **Rate limit discussion**: Can you handle our current peak load?
2. **Pilot program**: Test with subset of traffic
3. **Pricing quote**: Based on our projected usage
4. **Technical setup**: API integration and testing
5. **Gradual migration**: Phase in as primary provider

