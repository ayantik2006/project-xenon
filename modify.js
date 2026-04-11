const fs = require('fs');

const authModalPath = 'src/components/AuthModal.tsx';
let authModal = fs.readFileSync(authModalPath, 'utf8');

authModal = authModal.replace(
  'disabled={loading || !kycForm.formState.isValid}\n                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"',
  'disabled={loading}\n                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"'
);

authModal = authModal.replace(
  'const kycForm = useForm<KYCInput>({\n    resolver: zodResolver(kycSchema),\n  });',
  'const kycForm = useForm<KYCInput>({\n    resolver: zodResolver(kycSchema),\n    mode: "onChange",\n  });'
);
authModal = authModal.replace(
  'const kycForm = useForm<KYCInput>({\r\n    resolver: zodResolver(kycSchema),\r\n  });',
  'const kycForm = useForm<KYCInput>({\n    resolver: zodResolver(kycSchema),\n    mode: "onChange",\n  });'
);

authModal = authModal.replace(
  '<input\n                      {...kycForm.register("gstin")}\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black"\n                      placeholder="GST Number"\n                    />',
  '<input\n                      {...kycForm.register("gstin")}\n                      onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black uppercase"\n                      placeholder="GST Number"\n                    />'
);
authModal = authModal.replace(
  '<input\r\n                      {...kycForm.register("gstin")}\r\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black"\r\n                      placeholder="GST Number"\r\n                    />',
  '<input\n                      {...kycForm.register("gstin")}\n                      onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black uppercase"\n                      placeholder="GST Number"\n                    />'
);

authModal = authModal.replace(
  '<input\n                      {...kycForm.register("pan")}\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black"\n                      placeholder="PAN Number (e.g. ABCDE1234F)"\n                    />',
  '<input\n                      {...kycForm.register("pan")}\n                      onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black uppercase"\n                      placeholder="PAN Number (e.g. ABCDE1234F)"\n                    />'
);
authModal = authModal.replace(
  '<input\r\n                      {...kycForm.register("pan")}\r\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black"\r\n                      placeholder="PAN Number (e.g. ABCDE1234F)"\r\n                    />',
  '<input\n                      {...kycForm.register("pan")}\n                      onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()}\n                      className="w-full px-4 py-3 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-black uppercase"\n                      placeholder="PAN Number (e.g. ABCDE1234F)"\n                    />'
);


authModal = authModal.replace(
  '<button\n                  type="submit"\n                  disabled={loading}\n                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"\n                >\n                  {loading ? "Submit & Verify Phone" : "Submit & Verify Phone"}\n                </button>', // Wait, the UI has {loading ? "Submitting..." : "Submit & Verify Phone"}
  ''
);

authModal = authModal.replace(
  'type="submit"\n                  disabled={loading}\n                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"\n                >\n                  {loading ? "Submitting..." : "Submit & Verify Phone"}',
  'type="submit"\n                  disabled={loading || !kycForm.formState.isValid}\n                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"\n                >\n                  {loading ? "Submitting..." : "Submit & Verify Phone"}'
);
authModal = authModal.replace(
  'type="submit"\r\n                  disabled={loading}\r\n                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"\r\n                >\r\n                  {loading ? "Submitting..." : "Submit & Verify Phone"}',
  'type="submit"\n                  disabled={loading || !kycForm.formState.isValid}\n                  className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"\n                >\n                  {loading ? "Submitting..." : "Submit & Verify Phone"}'
);

fs.writeFileSync(authModalPath, authModal);

const profilePath = 'src/app/profile/page.tsx';
let profilePage = fs.readFileSync(profilePath, 'utf8');

profilePage = profilePage.replace(
  'const kycForm = useForm<ProfileKYCInput>({\n    resolver: zodResolver(profileKycSchema),\n  });',
  'const kycForm = useForm<ProfileKYCInput>({\n    resolver: zodResolver(profileKycSchema),\n    mode: "onChange",\n  });'
);
profilePage = profilePage.replace(
  'const kycForm = useForm<ProfileKYCInput>({\r\n    resolver: zodResolver(profileKycSchema),\r\n  });',
  'const kycForm = useForm<ProfileKYCInput>({\n    resolver: zodResolver(profileKycSchema),\n    mode: "onChange",\n  });'
);

profilePage = profilePage.replace(
  '<input {...kycForm.register("gstin")} className="w-full px-4 py-2.5 rounded-xl border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/10 font-bold text-xs" placeholder="GSTIN (Optional)" />',
  '<input {...kycForm.register("gstin")} onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()} className="w-full px-4 py-2.5 rounded-xl border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/10 font-bold text-xs uppercase" placeholder="GSTIN (Optional)" />\n                        {kycForm.formState.errors.gstin && <p className="text-[9px] text-red-500 font-bold">{kycForm.formState.errors.gstin.message}</p>}'
);

profilePage = profilePage.replace(
  '<input {...kycForm.register("pan")} className="w-full px-4 py-2.5 rounded-xl border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/10 font-bold text-xs" placeholder="PAN Number *" />',
  '<input {...kycForm.register("pan")} onInput={(e) => e.currentTarget.value = e.currentTarget.value.toUpperCase()} className="w-full px-4 py-2.5 rounded-xl border-none bg-gray-50 focus:ring-2 focus:ring-blue-500/10 font-bold text-xs uppercase" placeholder="PAN Number *" />'
);

profilePage = profilePage.replace(
  'disabled={kycSubmitting}\n                        className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] transition-transform disabled:opacity-50"',
  'disabled={kycSubmitting || !kycForm.formState.isValid}\n                        className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] transition-transform disabled:opacity-50"'
);
profilePage = profilePage.replace(
  'disabled={kycSubmitting}\r\n                        className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] transition-transform disabled:opacity-50"',
  'disabled={kycSubmitting || !kycForm.formState.isValid}\n                        className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black uppercase text-xs tracking-widest shadow-lg shadow-blue-100 hover:scale-[1.02] transition-transform disabled:opacity-50"'
);

fs.writeFileSync(profilePath, profilePage);
console.log("Done modifying both files.");
