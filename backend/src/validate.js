'use strict';
const { z } = require('zod');

const phone = z.string().trim().min(10).max(15).regex(/^[+0-9][0-9+ ]+$/);
const id = z.string().trim().min(1).max(40);

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone,
  pin: z.string().trim().min(4).max(12),
  village: z.string().trim().max(80).optional().default(''),
  district: z.string().trim().max(60).optional().default('Jaipur'),
});
const loginSchema = z.object({ phone, pin: z.string().trim().min(4).max(12) });
const adminLoginSchema = z.object({ username: z.string().trim().min(2).max(80), password: z.string().min(4).max(200) });

const applySchema = z.object({
  jobId: id,
  name: z.string().trim().min(2).max(80),
  phone,
  village: z.string().trim().max(80).optional().default(''),
  answers: z.string().trim().max(500).optional().default(''),
});
const reportSchema = z.object({
  jobId: z.string().trim().max(40).optional().default(''),
  reason: z.enum(['advance-fee', 'otp', 'fake-job', 'harassment', 'unsafe-place', 'wrong-pay', 'other']).optional().default('other'),
  detail: z.string().trim().min(3).max(1000),
  contact: z.string().trim().max(30).optional().default(''),
});
const certSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone: phone.optional().default(''),
});
const calcSchema = z.object({
  material: z.coerce.number().min(0).max(1e7).default(0),
  packing: z.coerce.number().min(0).max(1e7).default(0),
  transport: z.coerce.number().min(0).max(1e7).default(0),
  hours: z.coerce.number().min(0).max(1e4).default(0),
  wagePerHour: z.coerce.number().min(0).max(1e5).default(50),
  marginPct: z.coerce.number().min(0).max(500).default(20),
});
const employerSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.string().trim().max(60).optional().default('SHG'),
  district: z.string().trim().max(60).optional().default(''),
  contact: z.string().trim().min(6).max(30),
  job: z.string().trim().max(500).optional().default(''),
});
const empJobSchema = z.object({
  org: z.string().trim().min(2).max(120),
  title_hi: z.string().trim().min(3).max(120),
  title_en: z.string().trim().max(120).optional().default(''),
  category: z.string().trim().max(40).optional().default('general'),
  pay_hi: z.string().trim().max(60).optional().default('बातचीत पर'),
  village: z.string().trim().max(80).optional().default(''),
  district: z.string().trim().max(60).optional().default('Jaipur'),
  contact: z.string().trim().min(6).max(30),
  desc_hi: z.string().trim().max(800).optional().default(''),
  home_based: z.boolean().optional().default(false),
  part_time: z.boolean().optional().default(true),
});
const moderateSchema = z.object({
  kind: z.enum(['job', 'report', 'employer', 'hunar']),
  id: id,
  status: z.string().trim().min(2).max(30),
  suspendJob: z.boolean().optional().default(false),
  verified: z.boolean().optional(),
});
const feedbackSchema = z.object({
  message: z.string().trim().min(3).max(2000),
  page: z.string().trim().max(80).optional().default('/'),
});

function validate(schema) {
  return (req, res, next) => {
    const r = schema.safeParse(req.body);
    if (!r.success) return res.status(400).json({ error: 'invalid input', issues: r.error.issues.slice(0, 5) });
    req.valid = r.data; next();
  };
}

module.exports = { registerSchema, loginSchema, adminLoginSchema, applySchema, reportSchema, certSchema, calcSchema, employerSchema, empJobSchema, moderateSchema, feedbackSchema, validate };
