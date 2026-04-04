<!DOCTYPE html>

<html lang="en"><head>
<meta charset="utf-8"/>
<meta content="width=device-width, initial-scale=1.0" name="viewport"/>
<title>Custom Orders | The Confectioner’s Edit</title>
<script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:ital,wght@0,300;0,400;0,700;1,300&amp;family=Manrope:wght@200;300;400;600&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&amp;display=swap" rel="stylesheet"/>
<script id="tailwind-config">
      tailwind.config = {
        darkMode: "class",
        theme: {
          extend: {
            colors: {
              "outline-variant": "#d2c3c3",
              "on-tertiary": "#ffffff",
              "surface-container-highest": "#e5e2e1",
              "background": "#fcf9f8",
              "surface-bright": "#fcf9f8",
              "on-secondary": "#ffffff",
              "surface-tint": "#6a5b5b",
              "surface-variant": "#e5e2e1",
              "secondary-fixed-dim": "#e9c349",
              "on-primary": "#ffffff",
              "inverse-on-surface": "#f3f0ef",
              "on-background": "#1c1b1b",
              "surface-dim": "#dcd9d9",
              "on-primary-fixed": "#241919",
              "inverse-surface": "#313030",
              "on-surface-variant": "#4e4444",
              "on-primary-container": "#a99696",
              "secondary-fixed": "#ffe088",
              "on-secondary-fixed-variant": "#574500",
              "primary": "#261a1a",
              "secondary-container": "#fed65b",
              "inverse-primary": "#d6c2c1",
              "on-tertiary-fixed": "#1a1c19",
              "on-error": "#ffffff",
              "on-tertiary-container": "#9a9b97",
              "on-error-container": "#93000a",
              "surface": "#fcf9f8",
              "error-container": "#ffdad6",
              "on-secondary-fixed": "#241a00",
              "surface-container-high": "#ebe7e7",
              "surface-container-lowest": "#ffffff",
              "outline": "#807474",
              "error": "#ba1a1a",
              "on-tertiary-fixed-variant": "#454744",
              "tertiary-fixed": "#e3e3de",
              "on-primary-fixed-variant": "#524343",
              "primary-fixed-dim": "#d6c2c1",
              "secondary": "#735c00",
              "primary-fixed": "#f3dedd",
              "tertiary": "#1c1e1b",
              "tertiary-fixed-dim": "#c6c7c2",
              "tertiary-container": "#313330",
              "surface-container": "#f0edec",
              "primary-container": "#3c2f2f",
              "on-secondary-container": "#745c00",
              "on-surface": "#1c1b1b",
              "surface-container-low": "#f6f3f2"
            },
            fontFamily: {
              "headline": ["Noto Serif"],
              "body": ["Manrope"],
              "label": ["Manrope"]
            },
            borderRadius: {"DEFAULT": "0.125rem", "lg": "0.25rem", "xl": "0.5rem", "full": "0.75rem"},
          },
        },
      }
    </script>
<style>
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 24;
        }
        .tonal-shift-on-scroll {
            transition: background-color 0.5s ease;
        }
        input:focus, textarea:focus, select:focus {
            outline: none !important;
            border-bottom-color: #261a1a !important;
            ring: 0 !important;
        }
    </style>
</head>
<body class="bg-background text-on-surface font-body selection:bg-secondary-container selection:text-on-secondary-container">
<!-- TopNavBar -->
<nav class="fixed top-0 w-full z-50 bg-[#fcf9f8]/70 backdrop-blur-md shadow-sm">
<div class="flex justify-between items-center px-12 py-6 w-full max-w-[1920px] mx-auto">
<div class="font-['Noto_Serif'] italic text-2xl text-[#261a1a]">The Confectioner’s Edit</div>
<div class="hidden md:flex items-center space-x-12">
<a class="font-['Noto_Serif'] font-light tracking-widest uppercase text-sm text-[#261a1a] opacity-80 hover:opacity-100 hover:text-[#735c00] transition-all duration-500 ease-in-out cursor-pointer" href="#">Gallery</a>
<a class="font-['Noto_Serif'] font-light tracking-widest uppercase text-sm text-[#735c00] border-b border-[#735c00]/30 pb-1 cursor-pointer" href="#">Custom Orders</a>
<a class="font-['Noto_Serif'] font-light tracking-widest uppercase text-sm text-[#261a1a] opacity-80 hover:opacity-100 hover:text-[#735c00] transition-all duration-500 ease-in-out cursor-pointer" href="#">Our Story</a>
<a class="font-['Noto_Serif'] font-light tracking-widest uppercase text-sm text-[#261a1a] opacity-80 hover:opacity-100 hover:text-[#735c00] transition-all duration-500 ease-in-out cursor-pointer" href="#">Cart</a>
</div>
<div class="flex items-center">
<span class="material-symbols-outlined text-[#261a1a] cursor-pointer active:scale-95 transition-transform duration-300" data-icon="shopping_bag">shopping_bag</span>
</div>
</div>
</nav>
<main class="pt-32 pb-24">
<!-- Hero Section -->
<section class="px-12 mb-24 max-w-[1400px] mx-auto">
<div class="grid grid-cols-1 md:grid-cols-12 gap-12 items-end">
<div class="md:col-span-7">
<span class="font-label text-xs tracking-[0.2em] uppercase text-on-surface-variant mb-4 block">Bespoke Creations</span>
<h1 class="font-headline text-6xl md:text-8xl leading-tight text-primary mb-8">Crafting your <br/><span class="italic font-light">sweet vision.</span></h1>
<p class="font-body text-lg text-on-surface-variant max-w-xl leading-relaxed">
                        Every celebration is a unique story. We specialize in translating your most intimate inspirations into edible art that resonates with elegance and taste.
                    </p>
</div>
<div class="md:col-span-5 relative">
<div class="aspect-[4/5] bg-surface-variant overflow-hidden shadow-sm">
<img alt="Artistic cake design" class="w-full h-full object-cover grayscale-[20%] hover:scale-105 transition-transform duration-700" data-alt="Minimalist architectural white cake with delicate pressed dried flowers and organic texture against a soft cream background" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC3RnEWyTGx90fLlqlRj3J_mOdHnSH3bkwJJ_2SNI8D2Pc20Cblg31uTbJQ9_7ZNixmBBZwev7wiYY3zLgIMe26ZzJgU2d35iKTGC_GtLHABx5KM3zaHkdiV3IUzQAvskOu3bh63N2JnSfUG8LoZt2rMxeAfHj3Ka3wqHqBoFAKOL_57jYqC5IbX5aMQliv2nx0JeQnxT3CvmSE7n1De2riyD-VajkSfmoO_u1Hlx7iTZdu9EaWMNYQs4pW9ix8Av-Dd5HymS71BRM"/>
</div>
<div class="absolute -bottom-6 -left-6 bg-secondary-container p-8 hidden md:block">
<p class="font-headline italic text-xl text-on-secondary-container">The Edit 04</p>
</div>
</div>
</div>
</section>
<!-- Custom Order Form -->
<section class="bg-surface-container-low py-24 px-12">
<div class="max-w-[1400px] mx-auto">
<div class="grid grid-cols-1 lg:grid-cols-12 gap-24">
<div class="lg:col-span-4">
<h2 class="font-headline text-4xl text-primary mb-6">Request a Consultation</h2>
<p class="font-body text-on-surface-variant mb-12">Please provide the initial details for your bespoke commission. We recommend reaching out at least 4 weeks in advance for significant events.</p>
<div class="space-y-8">
<div>
<h4 class="font-label text-[10px] tracking-[0.3em] uppercase mb-2">Process</h4>
<p class="text-sm leading-relaxed">01. Submission &amp; Review<br/>02. Design Sketching<br/>03. Tasting Consultation<br/>04. Final Execution</p>
</div>
<div class="pt-8 border-t border-outline-variant/15">
<h4 class="font-label text-[10px] tracking-[0.3em] uppercase mb-2">Availability</h4>
<p class="text-sm leading-relaxed italic">Currently accepting commissions for late Summer and Autumn 2024.</p>
</div>
</div>
</div>
<div class="lg:col-span-8">
<form class="space-y-12">
<div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
<div class="relative group">
<label class="block font-label text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Client Name</label>
<input class="w-full bg-transparent border-0 border-b border-outline py-3 px-0 focus:ring-0 transition-colors duration-300 font-body placeholder:text-outline-variant/50" placeholder="Arthur Morgan" type="text"/>
</div>
<div class="relative group">
<label class="block font-label text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Email Address</label>
<input class="w-full bg-transparent border-0 border-b border-outline py-3 px-0 focus:ring-0 transition-colors duration-300 font-body placeholder:text-outline-variant/50" placeholder="hello@example.com" type="email"/>
</div>
<div class="relative group">
<label class="block font-label text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Event Date</label>
<input class="w-full bg-transparent border-0 border-b border-outline py-3 px-0 focus:ring-0 transition-colors duration-300 font-body" type="date"/>
</div>
<div class="relative group">
<label class="block font-label text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Event Type</label>
<select class="w-full bg-transparent border-0 border-b border-outline py-3 px-0 focus:ring-0 transition-colors duration-300 font-body appearance-none">
<option>Wedding Celebration</option>
<option>Intimate Soirée</option>
<option>Corporate Milestone</option>
<option>Artistic Editorial</option>
</select>
</div>
</div>
<div class="space-y-6">
<label class="block font-label text-[10px] tracking-widest uppercase text-on-surface-variant">Flavor Profile Preferences</label>
<div class="flex flex-wrap gap-3">
<button class="px-6 py-2 bg-surface-container-highest text-on-surface-variant font-label text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-300" type="button">Dark Chocolate &amp; Salted Caramel</button>
<button class="px-6 py-2 bg-secondary-container text-on-secondary-container font-label text-xs uppercase tracking-wider" type="button">Earl Grey &amp; Lavender</button>
<button class="px-6 py-2 bg-surface-container-highest text-on-surface-variant font-label text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-300" type="button">Lemon Thyme &amp; Honey</button>
<button class="px-6 py-2 bg-surface-container-highest text-on-surface-variant font-label text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-300" type="button">Pistachio &amp; Rosewater</button>
<button class="px-6 py-2 bg-surface-container-highest text-on-surface-variant font-label text-xs uppercase tracking-wider hover:bg-secondary-container hover:text-on-secondary-container transition-colors duration-300" type="button">Madagascar Vanilla</button>
</div>
</div>
<div class="relative group">
<label class="block font-label text-[10px] tracking-widest uppercase text-on-surface-variant mb-2">Design Concept &amp; Inspiration</label>
<textarea class="w-full bg-transparent border-0 border-b border-outline py-3 px-0 focus:ring-0 transition-colors duration-300 font-body placeholder:text-outline-variant/50 resize-none" placeholder="Describe your vision, color palette, or specific architectural influences..." rows="6"></textarea>
</div>
<div class="pt-6">
<button class="bg-primary text-on-primary font-label text-xs tracking-[0.2em] uppercase px-12 py-5 rounded-sm hover:opacity-90 transition-opacity flex items-center group" type="submit">
                                    Send Inquiry
                                    <span class="material-symbols-outlined ml-4 text-sm group-hover:translate-x-2 transition-transform duration-300" data-icon="arrow_forward">arrow_forward</span>
</button>
</div>
</form>
</div>
</div>
</div>
</section>
<!-- Inspiration Gallery (Asymmetric Bento) -->
<section class="px-12 py-32 max-w-[1400px] mx-auto">
<div class="mb-16">
<h3 class="font-headline text-5xl text-primary mb-4">Past Work</h3>
<p class="font-body text-on-surface-variant max-w-lg">A curated archive of bespoke commissions, from sculptural minimalist forms to intricate floral narratives.</p>
</div>
<div class="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-8 h-[1000px]">
<div class="md:col-span-2 md:row-span-2 bg-surface-variant relative group overflow-hidden">
<img class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" data-alt="Towering four-tier wedding cake with organic textured white frosting and a cascade of sculptural sugar flowers in muted blush tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBj--cpr7eupxGaKc2sFjJXpJ0kenWN8lEJxeRw69rGiqKRT8YCvK_zVysRNQ-mtbwvBxfUzDDdm8eQdYG9aDRl8gJT5ENtVIdmlxyQ_P6xQLwP2wzcbfopRVF-552M-wOpZFnDYRCoB2nMPeOiFPZjPSl71ZTkF5A6-1xS6Reo3Jd7J-OffNuWySe6zVvMzCGH4brz733yIDAV_76EMKKIy4n8roIto4HPl-r8HIQQemhwIgHlQALwHN1RKog6yw2PnX7sZEbSAws"/>
<div class="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-center justify-center p-12">
<div class="text-center">
<span class="font-label text-xs tracking-widest uppercase text-white mb-2 block">Commission 882</span>
<h4 class="font-headline text-3xl text-white">The Seraphina</h4>
</div>
</div>
</div>
<div class="md:col-span-1 md:row-span-1 bg-surface-variant relative group overflow-hidden">
<img class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" data-alt="Square modern cake with sharp edges and a dramatic black chocolate glaze finish decorated with edible gold leaf accents" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA5bbcB6moSvRtVcsm7lVhqiDe_EKsKQ6ayiKcZXKjgHui8fpwRWaioCBPMkQUz1Gg4uB5lOHGIYj-HysWb7J57RzPXI89MeZyZcUT-b3DwJ4oWICnm8a24KW6PK5344wVFaLCtsYsnFAh8EoYtNjC65r2xv41zBdG44tWrGRAhjOH-QovN0uAJqQfuxjO-O-vVVBN5-4kumKHjvsMOe6Z-aDt8qOvrfzhMAJ9_RXxGlZBNyq5aZezGxMW_Yt0aP4unTf_em7Bm1fc"/>
<div class="absolute bottom-6 left-6 text-on-surface">
<span class="font-label text-[10px] tracking-widest uppercase">Abstract No. 4</span>
</div>
</div>
<div class="md:col-span-1 md:row-span-2 bg-surface-variant relative group overflow-hidden">
<img class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" data-alt="Close up of a minimalist white cake featuring delicate hand-painted botanical illustrations in soft charcoal ink" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa80lWrRi_MTITn5qg2he38R7Pk23t2RvPUjZWquM4NAAqAuY9DjHRFSkZgHszqUpn7M__24lmFKvqtp6xoiCsirRhEjvX-Pxoyb2FSCL0z4kywrUnQFHL3CtQtMNLMzlXSbFhmSaA7sojBaJZkFYPKDIpa0wco4WBBzQv6xIBGbJDMzI3BhQT-rPbLAlOivHlSkglHa9F25nAnX5b9ZyvObz56DCd6CgxovYrLDnDC3VyHnglsZjHJNZBT5h5iCpavfmTckRBBHI"/>
<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
<span class="font-headline italic text-8xl text-white/20 select-none">Botanical</span>
</div>
</div>
<div class="md:col-span-1 md:row-span-1 bg-surface-variant relative group overflow-hidden">
<img class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" data-alt="Vibrant tiered cake inspired by French impressionist paintings with colorful palette knife textured icing and fresh summer berries" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA78GZ-rwXBn3RnoHwsyN71vkKWEwYLxnqBIsa3ZAcX_ynpzJ0JYXmICNJzT3wa9nkyR9vF_VkQ3celuYM5H7B8asxdTQguog-0zgsesvjXEp1MYsQHgA2j-7RZ7T47YHRRqo5LRkwUMs5n8eRWYPHWUd8bmhXM-HlO4EDSla1EG-4fRJYFDk4miqi-py1arl6t5IR00dETb1Vpuiilp9dgxJPhJUJWclNpGkSzxLtSxUycZdRyG4oAKjGPmXiPzdHIyatMtuUrlxI"/>
<div class="absolute top-6 right-6">
<span class="material-symbols-outlined text-white" data-icon="star" style="font-variation-settings: 'FILL' 1;">star</span>
</div>
</div>
</div>
</section>
</main>
<!-- Footer -->
<footer class="bg-[#ebe7e7] w-full pt-24 pb-12">
<div class="flex flex-col md:flex-row justify-between items-start px-12 w-full border-t border-[#d2c3c3]/15 pt-12">
<div class="mb-12 md:mb-0">
<span class="font-['Noto_Serif'] text-lg mb-4 block text-[#261a1a]">THE CONFECTIONER’S EDIT</span>
<p class="font-body text-xs tracking-tighter uppercase text-[#261a1a] opacity-60 max-w-[200px] leading-relaxed">
                    Sculpting sweetness for the modern romantic.
                </p>
</div>
<div class="flex flex-col space-y-4">
<a class="font-['Manrope'] text-xs tracking-tighter uppercase text-[#261a1a] opacity-60 hover:opacity-100 transition-opacity duration-400" href="#">Privacy Policy</a>
<a class="font-['Manrope'] text-xs tracking-tighter uppercase text-[#261a1a] opacity-60 hover:opacity-100 transition-opacity duration-400" href="#">Shipping &amp; Returns</a>
<a class="font-['Manrope'] text-xs tracking-tighter uppercase text-[#261a1a] opacity-60 hover:opacity-100 transition-opacity duration-400" href="#">Contact Us</a>
</div>
<div class="mt-12 md:mt-0">
<p class="font-['Manrope'] text-xs tracking-tighter uppercase text-[#261a1a] opacity-60">© 2024 THE CONFECTIONER’S EDIT. ALL RIGHTS RESERVED.</p>
</div>
</div>
</footer>
</body></html>
