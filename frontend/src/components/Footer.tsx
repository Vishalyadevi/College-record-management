import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#003087] text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4 font-['Arial']">About</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-gray-300">Facts</a></li>
              <li><a href="#" className="hover:text-gray-300">History</a></li>
              <li><a href="#" className="hover:text-gray-300">Careers</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 font-['Arial']">Research</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-gray-300">Green Energy</a></li>
              <li><a href="#" className="hover:text-gray-300">ED Cell</a></li>
              <li><a href="#" className="hover:text-gray-300">NEC - Business Incubator</a></li>
              <li><a href="#" className="hover:text-gray-300">KR Innovation Centre</a></li>
              <li><a href="#" className="hover:text-gray-300">IEDC</a></li>
              <li><a href="#" className="hover:text-gray-300">Newgen IEDC Portal</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 font-['Arial']">Academics</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-gray-300">Schools</a></li>
              <li><a href="#" className="hover:text-gray-300">Departments</a></li>
              <li><a href="#" className="hover:text-gray-300">Programs</a></li>
            </ul>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-4 font-['Arial']">Connect</h3>
            <div className="flex space-x-4">
              <a href="#" className="hover:text-gray-300"><Facebook /></a>
              <a href="#" className="hover:text-gray-300"><Twitter /></a>
              <a href="#" className="hover:text-gray-300"><Instagram /></a>
              <a href="#" className="hover:text-gray-300"><Linkedin /></a>
            </div>
          </div>
        </div>
        <div className="mt-8 border-t border-[#1a4b8c]">
          <p className="text-center text-sm">© 2024 National Engineering College. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
