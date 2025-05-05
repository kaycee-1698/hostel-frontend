'use client';
import React, { useState, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Guest, Booking } from '@/types';
import { createGuest, uploadFile } from '@/lib/api';

export default function CheckInForm({ booking }: { booking: Booking }) {
    const [form, setForm] = useState<Partial<Guest>>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, type } = e.target;
    let newValue: any;
  
    if (type === 'checkbox') {
      newValue = (e.target as HTMLInputElement).checked;
    } else if (type === 'file') {
      const files = (e.target as HTMLInputElement).files;
      newValue = files && files[0] ? files[0] : null; // Store actual File object (not just URL)
    } else {
      newValue = e.target.value;
    }
  
    setForm((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };
  

  const handleFileUpload = async (file: File, name: string) => {
    if (file) {
      try {
        const fileURL = await uploadFile(file);
        setForm((prev) => ({
          ...prev,
          [name]: fileURL, // Store the URL of the uploaded file
        }));
      } catch (error) {
        console.error('File upload failed:', error);
        alert('Failed to upload file');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await createGuest(form);
      console.log('Guest created:', form);
      alert('Guest checked in successfully!');
    } catch (error) {
      console.error(error);
      alert('Error submitting form');
    }
  };

  const sigCanvas = useRef<SignatureCanvas>(null);

  const clearSignature = () => {
    sigCanvas.current?.clear();
  };

  const saveSignature = (name: string) => {
    if (sigCanvas.current?.isEmpty()) {
      alert("Please provide a signature");
      return;
    }
    const dataURL = sigCanvas.current?.toDataURL(); // You can upload or store this
    console.log("Signature Data URL:", dataURL);
    setForm((prev) => ({
        ...prev,
        [name]: dataURL, // Store the URL of the uploaded file
      }));
    // Save it to form state if needed
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md max-w-2xl mx-auto">
  {/* Booking Details Summary */}
  <div className="bg-gray-100 p-4 rounded-md">
    <p><strong>Check-in:</strong> {booking.check_in}</p>
    <p><strong>Check-out:</strong> {booking.check_out}</p>
    <p><strong>Nights:</strong> {booking.number_of_nights}</p>
    <p><strong>Travelling as:</strong> 
      {booking.number_of_adults === 1 ? ' Solo' : booking.number_of_adults === 2 ? ' Duo' : ' Group'}
    </p>
  </div>

  {/* Guest Information */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input name="first_name" placeholder="First Name" value={form.first_name} onChange={handleChange} required className="input" />
    <input name="last_name" placeholder="Last Name" value={form.last_name} onChange={handleChange} className="input" />
    <input name="birthday" type="date" value={form.birthday} onChange={handleChange} className="input" />
    <input name="email" placeholder="Email" value={form.email} onChange={handleChange} className="input" />
    <input name="phone" placeholder="Phone" value={form.phone} onChange={handleChange} className="input" />
    <input name="city" placeholder="City" value={form.city} onChange={handleChange} className="input" />
    <input name="country" placeholder="Country" value={form.country} onChange={handleChange} className="input" />
    <select name="gender" value={form.gender} onChange={handleChange} className="input">
      <option value="">Select Gender</option>
      <option>Male</option>
      <option>Female</option>
      <option>Other</option>
    </select>
  </div>

  {/* Travel Info */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <input name="purpose_of_visit" placeholder="Purpose of Visit" value={form.purpose_of_visit} onChange={handleChange} className="input" />
    <input name="how_heard_about_us" placeholder="How did you hear about us?" value={form.how_heard_about_us} onChange={handleChange} className="input" />
    <select name="id_type" value={form.id_type} onChange={handleChange} className="input">
      <option value="">Select ID Type</option>
      <option>Passport</option>
      <option>Aadhar</option>
      <option>Driving License</option>
    </select>
    <input name="id_number" placeholder="ID Number" value={form.id_number} onChange={handleChange} className="input" />
  </div>

  <div className="flex items-center space-x-4">
    <label className="flex items-center space-x-2">
      <input type="checkbox" name="stayed_before" checked={form.stayed_before} onChange={handleChange} />
      <span>Stayed Before?</span>
    </label>
  </div>

  {/* File Upload Section */}
  <div className="space-y-4">
    <div>
      <label className="block mb-1 font-medium">Upload ID Front (JPEG/PNG)</label>
      <input
        type="file"
        name="id_front"
        accept="image/jpeg, image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'id_front');
        }}
        className="input"
      />
    </div>
    <div>
      <label className="block mb-1 font-medium">Upload ID Back (JPEG/PNG)</label>
      <input
        type="file"
        name="id_back"
        accept="image/jpeg, image/png"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileUpload(file, 'id_back');
        }}
        className="input"
      />
    </div>
  </div>

{/* Signature Section */}
  <div className="space-y-2">
      <label className="block font-medium">Draw Signature</label>
      <div className="border border-gray-300 rounded-md p-2 bg-white">
        <SignatureCanvas
          penColor="black"
          canvasProps={{ width: 300, height: 150, className: 'w-full h-36 bg-white rounded' }}
          ref={sigCanvas}
        />
      </div>
      <div className="flex space-x-2 mt-2">
        <button type="button" onClick={clearSignature} className="text-sm text-red-500 underline">Clear</button>
        <button type="button" onClick={() => saveSignature('signature')} className="text-sm text-green-600 underline">Save Signature</button>
      </div>
    </div>

  {/* Agreements */}
  <div className="space-y-2">
    <label className="flex items-center space-x-2">
      <input type="checkbox" name="agree_tnc" checked={form.agree_tnc} onChange={handleChange} required />
      <span>I agree to the terms and conditions</span>
    </label>
    <label className="flex items-center space-x-2">
      <input type="checkbox" name="agree_checkout" checked={form.agree_checkout} onChange={handleChange} required />
      <span>I acknowledge the checkout time</span>
    </label>
  </div>

  {/* Submit */}
  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded w-full">
    Submit
  </button>
</form>

  );

};

