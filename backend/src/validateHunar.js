'use strict';
const { z } = require('zod');
const phone = z.string().trim().min(10).max(15).regex(/^[+0-9][0-9+ ]+$/);

const hunarSchema = z.object({
  name: z.string().trim().min(2).max(80),
  phone,
  village: z.string().trim().max(80).optional().default(''),
  district: z.string().trim().max(60).optional().default('Jaipur'),
  skills: z.array(z.string().trim().min(1).max(40)).min(1).max(10),
  experience: z.string().trim().max(300).optional().default(''),
  expected_work: z.string().trim().max(200).optional().default(''),
  available_home: z.boolean().optional().default(true),
  photo: z.string().trim().max(20).optional().default(''),
});
const interestSchema = z.object({
  by_name: z.string().trim().min(2).max(80),
  by_contact: z.string().trim().min(6).max(30),
  message: z.string().trim().max(500).optional().default(''),
});

module.exports = { hunarSchema, interestSchema };
