--
-- PostgreSQL database dump
--

\restrict 6kXhNv6e6VPEP7e5JlDBVj7JA7wfkQunvXK1PCIkbwl8ccvYs0rPF8tB0362KgR

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.products (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    sku character varying(70) NOT NULL,
    price numeric(10,2) NOT NULL,
    quantity integer DEFAULT 0 NOT NULL,
    category_id integer NOT NULL,
    CONSTRAINT products_quantity_check CHECK ((quantity >= 0))
);


ALTER TABLE public.products OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.products_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.products_id_seq OWNER TO postgres;

--
-- Name: products_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.products_id_seq OWNED BY public.products.id;


--
-- Name: suppliers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.suppliers (
    id integer NOT NULL,
    supplier_name character varying(100) NOT NULL,
    contact_person character varying(100) NOT NULL,
    email character varying(250) NOT NULL,
    phone character varying(20) NOT NULL,
    address text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.suppliers OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.suppliers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.suppliers_id_seq OWNER TO postgres;

--
-- Name: suppliers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.suppliers_id_seq OWNED BY public.suppliers.id;


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: products id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products ALTER COLUMN id SET DEFAULT nextval('public.products_id_seq'::regclass);


--
-- Name: suppliers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers ALTER COLUMN id SET DEFAULT nextval('public.suppliers_id_seq'::regclass);


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, name) FROM stdin;
1	Electronics
2	Furniture
3	Groceries
4	Stationery
5	Clothing
6	Sports
7	Books
8	Kitchen
9	Office Supplies
10	Automotive
12	G-shock
\.


--
-- Data for Name: products; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.products (id, name, sku, price, quantity, category_id) FROM stdin;
2	Unbranded Aluminum Shoes	4KJKTCMZ	37741.00	52	4
3	Recycled Bamboo Chips	RS8XQ8XL	39568.00	179	5
4	Fresh Ceramic Computer	9NZF6NT1	45949.00	198	5
5	Unbranded Plastic Bacon	ZKKAATCY	12003.00	73	4
6	Modern Granite Shirt	OEFINDEK	29940.00	185	1
7	Soft Wooden Pizza	FWCLVJWH	44199.00	86	2
8	Licensed Ceramic Cheese	X46ADQXZ	5819.00	157	1
9	Refined Steel Keyboard	BLH7Z8BA	19727.00	14	3
10	Frozen Plastic Bike	T0SOACQL	32688.00	6	5
11	Recycled Ceramic Table	BN0NDN87	39182.00	105	1
12	Fresh Bronze Mouse	CFYDYT6E	6858.00	158	4
13	Rustic Bamboo Fish	3DNW88HL	31625.00	147	3
14	Oriental Aluminum Shirt	WCXYABCK	34578.00	10	4
15	Electronic Concrete Shoes	MVORS3RB	49132.00	97	1
16	Incredible Steel Bike	VFAWVPE5	6320.00	194	5
17	Gorgeous Marble Pants	7AYX6UHA	41649.00	186	3
18	Ergonomic Concrete Sausages	VV98VQKX	11316.00	136	5
19	Luxurious Bronze Mouse	ZF6LD8WS	39111.00	32	2
20	Handcrafted Marble Towels	LAOPQONV	32167.00	128	3
21	Ergonomic Gold Cheese	IJZVIZ4F	17251.00	134	2
22	Fantastic Plastic Fish	R5ZEWCFY	20807.00	69	5
23	Refined Rubber Bacon	6G83P8D8	36399.00	28	1
24	Generic Plastic Cheese	ZJPSQBBN	25327.00	158	2
25	Generic Steel Bacon	ABNMVXCR	47826.00	164	2
26	Small Silk Tuna	TC1QGC2W	40912.00	41	1
27	Licensed Aluminum Gloves	LYLPDO1F	27126.00	29	3
28	Recycled Silk Chicken	AYKYVP4L	11467.00	143	2
29	Modern Silk Bike	QWRQKYGR	15450.00	108	3
30	Fantastic Bamboo Tuna	CCISY4GA	13592.00	37	5
31	Frozen Granite Keyboard	O0YNXWHQ	19153.00	36	4
32	Refined Cotton Ball	UEGKTP3E	2371.00	172	1
33	Tasty Cotton Table	QNDBWOXN	40890.00	186	2
34	Elegant Wooden Pants	C1U6XKKD	43055.00	165	4
35	Electronic Plastic Shoes	ZABNCCW0	9271.00	161	3
36	Handcrafted Metal Shoes	5WDMNQQU	18751.00	162	4
37	Handcrafted Concrete Ball	O9XYRL5X	1176.00	181	5
38	Electronic Bamboo Gloves	OTMYD8DM	16410.00	64	1
39	Soft Plastic Salad	KWPA2BOA	33123.00	80	4
40	Electronic Aluminum Ball	KSI7UFJ0	19266.00	71	3
41	Recycled Plastic Chair	PH1EJFMM	39403.00	181	4
42	Unbranded Granite Shoes	6ICM3AAU	37705.00	136	4
43	Fantastic Granite Car	IZORDTE1	19681.00	187	2
44	Small Wooden Shirt	KXKXU6JT	26231.00	32	1
45	Fantastic Steel Sausages	J1NTBRXK	14288.00	17	3
46	Modern Bamboo Pizza	BMKLEIFU	2193.00	198	5
47	Luxurious Ceramic Cheese	053ZMNJQ	45291.00	109	3
48	Gorgeous Marble Sausages	CD34GM9A	10591.00	169	3
49	Sleek Metal Salad	HOP09MJV	1463.00	134	4
50	Recycled Marble Hat	8VJMVJNW	19909.00	199	3
51	Small Silk Table	73KXCKSV	7923.00	106	4
52	Incredible Steel Pizza	F26CFIML	20019.00	121	5
53	Soft Ceramic Towels	BFAAAJ5S	11072.00	66	3
54	Refined Granite Bacon	J2C3NSVG	27088.00	111	2
55	Unbranded Gold Ball	L9JGPVGE	3791.00	33	5
56	Rustic Granite Bacon	CH5MVRUT	35668.00	143	4
57	Rustic Marble Hat	PRPN0KGD	16910.00	118	3
58	Refined Marble Pizza	C5XUAPI9	19261.00	186	1
59	Refined Bamboo Ball	5EGAAKCM	38490.00	144	5
60	Gorgeous Wooden Pants	VUTF3QCC	36931.00	179	5
61	Fantastic Plastic Shoes	MKJPLS1F	6608.00	111	1
62	Sleek Granite Sausages	Y6GFYRT7	27132.00	125	4
63	Soft Wooden Bike	IFMDMFJ5	3005.00	182	3
64	Tasty Bamboo Gloves	V93AU36V	42648.00	89	4
65	Small Steel Bike	OZCDQZJY	41262.00	72	2
66	Refined Granite Fish	QOIFQAN0	46111.00	172	4
67	Intelligent Silk Towels	HSDYRFCY	20833.00	97	2
68	Ergonomic Steel Chicken	RKFC0VWI	39282.00	38	2
69	Small Silk Fish	SBGDJATD	48328.00	109	5
70	Gorgeous Marble Tuna	DVGHWQYN	46925.00	17	2
71	Fantastic Rubber Soap	YH4X1EPE	38985.00	64	1
72	Modern Steel Towels	ILVT2QG2	35631.00	68	2
73	Sleek Cotton Sausages	F1QECOQO	3964.00	110	4
74	Ergonomic Wooden Chair	UQIB5AEX	16740.00	166	3
75	Frozen Wooden Shoes	E0FWVCGN	26644.00	16	2
76	Sleek Silk Pizza	ZEJLOTNU	1733.00	112	3
77	Frozen Bronze Keyboard	ZOTLZAC0	47068.00	24	3
78	Modern Wooden Ball	7QPHCCYG	10426.00	135	2
79	Rustic Cotton Pizza	6COVQGC4	29424.00	166	5
80	Fantastic Rubber Chair	CQEEZK2M	42424.00	18	1
81	Bespoke Bronze Shoes	K3O4MD2A	43167.00	23	4
82	Rustic Bamboo Chair	WKKUHYYV	1359.00	47	5
83	Modern Silk Computer	KDUMQAMW	2724.00	75	4
84	Luxurious Gold Shoes	FUJJZUAA	26407.00	41	4
85	Electronic Plastic Gloves	WJXUDWCN	3198.00	144	4
86	Modern Bronze Cheese	TV2LZ96N	16033.00	89	2
87	Bespoke Steel Ball	AP79S93H	33634.00	183	3
88	Gorgeous Cotton Chips	9PCNURQR	9356.00	27	1
89	Fresh Metal Soap	HUKJFAWL	516.00	52	1
90	Fantastic Metal Computer	FAHNPPVE	11812.00	118	2
91	Generic Marble Cheese	CT6R7KMU	38055.00	44	3
92	Bespoke Plastic Car	XCRZWDKQ	31606.00	109	3
93	Bespoke Bronze Ball	SUZO3MX4	6154.00	42	4
94	Licensed Rubber Cheese	EQSZE1GU	19440.00	28	3
95	Bespoke Bamboo Chair	AMZHVWRA	7085.00	95	4
96	Incredible Marble Bike	WOHIXQQH	7049.00	36	1
97	Luxurious Steel Shoes	A6I8S9KF	21417.00	41	5
98	Unbranded Steel Table	NFXJHMIX	858.00	48	5
99	Gorgeous Concrete Table	NDFFM7ZW	4381.00	197	5
100	Fresh Bronze Ball	4PC7DG2C	144.00	25	1
101	Luxurious Metal Computer	HHIY0ZRS	23844.00	11	3
\.


--
-- Data for Name: suppliers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.suppliers (id, supplier_name, contact_person, email, phone, address, created_at) FROM stdin;
1	Lemke - Becker	Fred Gleichner	Jaydon.Abernathy@hotmail.com	5	713 Kaya Run Apt. 433	2026-07-19 13:14:33.126775
2	Bernier Inc	Rogelio Mante	Florine25@gmail.com	2	8774 Riverside Apt. 833	2026-07-19 13:14:33.132157
3	Macejkovic - Parisian	Gail Boyer-Towne	Elvera48@gmail.com	1	721 W Washington Street Apt. 142	2026-07-19 13:14:33.133585
5	Runte - Kirlin	Joshua Larkin	Jaida_Kozey@gmail.com	4352941707	775 W Broadway Street Apt. 460	2026-07-19 13:14:35.702538
6	Rau Inc	Blanca Gerhold	Nicholaus_Runte40@yahoo.com	2619816691	78829 Cedar Avenue Suite 824	2026-07-19 13:14:35.706139
7	Gerlach, Reynolds and Dickinson	Mercedes Bednar	Maggie.OConner@hotmail.com	2006351281	60513 E Front Street Apt. 726	2026-07-19 13:14:35.707151
8	Erdman and Sons	Brandy Funk-Dooley	Jackie.Huels@gmail.com	7221032917	4476 Park Road Suite 869	2026-07-19 13:14:35.707833
9	King - Torp	Loren Wiza	Catherine36@yahoo.com	1169967946	848 Watery Lane Suite 433	2026-07-19 13:14:35.708459
10	Bergstrom, Marvin and Weber	Tara Spencer	Danny_VonRueden@yahoo.com	5503098845	155 Weissnat Fields Suite 465	2026-07-19 13:14:35.709083
11	Dickens Inc	Glenda Pfannerstill	Daphney_Quigley49@yahoo.com	3342975049	57218 Liana Burg Apt. 635	2026-07-19 13:14:35.709825
12	Schinner Group	Ashley Kautzer	Kellen.Williamson14@hotmail.com	3261792885	8289 Hickle Hill Apt. 796	2026-07-19 13:14:35.710535
13	Gutkowski, Treutel and Howell	Rufus Cremin	Armando_Kris@gmail.com	0365896498	47227 Rahsaan Glen Apt. 808	2026-07-19 13:14:35.711452
14	Cormier, Skiles and Cronin	Tracy Gleason	Lauren_Windler@hotmail.com	3439289634	820 Friesen Port Suite 348	2026-07-19 13:14:35.712193
15	Abshire Group	Vernon Feeney	Felicita_Willms57@yahoo.com	5781775704	27694 Ken Burg Suite 102	2026-07-19 13:14:35.712737
16	Herzog and Sons	Herbert Pouros	Rowena.OKon@gmail.com	9292319786	2381 Ryder Mountain Suite 116	2026-07-19 13:14:35.713271
17	Fritsch and Sons	Elsie Koch	Ted.Weimann61@gmail.com	4270832422	52491 Quitzon Mount Apt. 663	2026-07-19 13:14:35.713768
18	Mann Inc	Tasha Bayer	Garth_Jaskolski@hotmail.com	8015850954	276 Greenholt Ridge Apt. 502	2026-07-19 13:14:35.71428
19	Anderson, Orn and Feest	Charlie Bogisich	Peyton71@hotmail.com	8954352732	680 Cecelia Estate Suite 742	2026-07-19 13:14:35.71482
20	Schaefer, Steuber and Nicolas	Mr. Glenn Mante PhD	Dora_Gleichner@yahoo.com	8700704078	4971 Liza Center Apt. 807	2026-07-19 13:14:35.715473
21	Romaguera - Hoppe	Perry Torphy	Beatrice.Koelpin79@gmail.com	8973776408	69477 New Lane Apt. 211	2026-07-19 13:14:35.716004
22	Marquardt Inc	Matthew Green	Haven1@yahoo.com	5872014250	336 Collier Loop Suite 623	2026-07-19 13:14:35.716481
23	Daugherty Group	Mr. Al Greenholt I	Dora.Heaney25@hotmail.com	1076168160	2439 S Chestnut Street Suite 502	2026-07-19 13:14:35.716959
24	Brown and Sons	Mae Kihn	Lucius38@yahoo.com	1174619503	64970 E Elm Street Suite 802	2026-07-19 13:14:35.717432
25	Bartoletti Inc	Hugh Dietrich	Bart54@gmail.com	1149643810	7334 Pollich Lake Suite 573	2026-07-19 13:14:35.717905
26	Homenick, Pfeffer and White	Jan Willms	Leif.Carter@gmail.com	2188870117	9282 Walker Bypass Apt. 615	2026-07-19 13:14:35.718539
27	Runolfsson, Gerlach and Will	Herman Altenwerth	Erna_Reichel27@hotmail.com	1043156099	522 Jonatan Falls Apt. 422	2026-07-19 13:14:35.719184
28	Lueilwitz, Waelchi and Nitzsche	Mabel Ratke	Jaclyn1@yahoo.com	0177900164	134 N 4th Street Apt. 335	2026-07-19 13:14:35.719855
29	West LLC	Mr. Lionel Corwin	Lucinda97@gmail.com	6165598673	12799 Schaefer Manors Suite 386	2026-07-19 13:14:35.720512
30	Witting, Robel and Sauer	Catherine Dare	Ricky.Kuhic@hotmail.com	8743620647	851 S Broad Street Apt. 302	2026-07-19 13:14:35.721137
31	McClure - Bogisich	Dr. Melanie Beier	Ward.Davis@yahoo.com	4915127979	6916 Maple Avenue Suite 799	2026-07-19 13:14:35.721706
32	Stokes LLC	Brad Leuschke	Will64@gmail.com	7489068532	38778 Ruben Haven Apt. 889	2026-07-19 13:14:35.72222
33	Huel and Sons	Reginald Goyette-Ebert	Major_Huel-Aufderhar@gmail.com	6865975627	450 Rohan Village Suite 900	2026-07-19 13:14:35.72285
34	Blick - DuBuque	Miranda Carter	Betsy.Collins6@gmail.com	7865718954	10537 Brooks Wells Apt. 602	2026-07-19 13:14:35.723527
35	Rolfson and Sons	Casey Schultz	Gilbert14@gmail.com	6731056120	5408 Rowe Field Apt. 367	2026-07-19 13:14:35.72412
36	Mante, Hodkiewicz and Marvin	Oliver Rempel	Dorcas_Bauch@hotmail.com	5903407896	8777 Skyline Drive Suite 619	2026-07-19 13:14:35.724624
37	Reichel - Stracke	Glenda Murphy	Aaron10@hotmail.com	4100650436	12421 Zita Mills Suite 336	2026-07-19 13:14:35.725133
38	Orn - Dickens	Marty Yundt	Randy58@hotmail.com	7842632964	9709 Springfield Road Apt. 612	2026-07-19 13:14:35.725641
39	Reichert - Cormier	Alison Hessel	Dale68@yahoo.com	1595746683	2765 Tyler Ridges Suite 717	2026-07-19 13:14:35.726118
40	Wehner - Bode	Mrs. Sylvia Trantow	Evelyn75@yahoo.com	4878595847	21139 Douglas Flat Suite 164	2026-07-19 13:14:35.72661
41	Mohr - Orn	Thomas Farrell	Dameon.Bradtke@gmail.com	4605534370	2823 Monserrat Hill Apt. 986	2026-07-19 13:14:35.727081
42	Abbott Group	Miss Misty Denesik	Tad_Koch79@hotmail.com	5381126452	253 Joaquin Forges Apt. 873	2026-07-19 13:14:35.727558
43	Kutch - Schultz	Ora Brown	Rylee_Hammes@hotmail.com	4616369780	436 Clay Lane Apt. 670	2026-07-19 13:14:35.728049
44	Moen - Schroeder	Patrick Kautzer-Osinski	Heath_Weimann21@gmail.com	7295242171	660 Ziemann Run Suite 365	2026-07-19 13:14:35.728565
45	Terry - Hudson	Herman Upton	Berneice.McClure@gmail.com	9695032559	11740 Haag Viaduct Apt. 478	2026-07-19 13:14:35.729096
46	Dooley - Schowalter	Stewart Johnson	Darius32@yahoo.com	4068703991	7724 State Avenue Suite 568	2026-07-19 13:14:35.729588
47	Satterfield LLC	Natalie Stark	Dalton19@hotmail.com	8011851513	38860 Prospect Place Apt. 105	2026-07-19 13:14:35.73011
48	Hauck - Hilpert	Dr. Darryl Paucek	Rhett57@hotmail.com	1076153031	94892 Aracely Hills Apt. 450	2026-07-19 13:14:35.730606
49	Nitzsche LLC	Ramona Batz	Cyril_Mueller32@yahoo.com	9171673896	394 Arjun Passage Apt. 491	2026-07-19 13:14:35.731083
50	Skiles, Collins and Koch	Kristin Hodkiewicz	Mateo28@gmail.com	6225311506	304 Beech Drive Suite 404	2026-07-19 13:14:35.731581
51	Metz - Runolfsson	Whitney Konopelski	Lavon_Johnson@yahoo.com	7875991956	872 Denesik Meadows Apt. 226	2026-07-19 13:14:35.732106
52	Schmeler, Bode and VonRueden	Charles Carter	Isabelle92@gmail.com	0782988630	620 Ridge Road Apt. 258	2026-07-19 13:14:35.732579
53	Kilback, Heathcote and Sawayn	Glenda Armstrong Sr.	Nia.Kuvalis63@gmail.com	5484361129	32097 Ryley Lake Suite 661	2026-07-19 13:14:35.733087
54	Hessel, Abbott and Yundt	Earl Franecki	Schuyler.Collier@gmail.com	1130313740	1136 Grayce Viaduct Apt. 536	2026-07-19 13:14:35.733589
55	Von Inc	Cassandra Deckow I	Kory.Turcotte@gmail.com	7617677791	927 Lesly Fort Suite 357	2026-07-19 13:14:35.734066
56	Ward Group	Shaun Dare	Jason_MacGyver73@yahoo.com	3545527648	3771 Orrin Manor Apt. 579	2026-07-19 13:14:35.734537
57	Brown, Wiegand and West	Beulah Franecki	Leta.Denesik@gmail.com	4420559977	9085 Murphy Hollow Apt. 131	2026-07-19 13:14:35.735112
58	Nader, Simonis and Shields	Rickey Hand	Toy12@hotmail.com	0734484148	586 Hand Shoals Suite 545	2026-07-19 13:14:35.735592
59	Dickens, Bradtke and Homenick	Wilbert Miller	Christopher_Cartwright77@gmail.com	4089463770	389 Ankunding Burg Suite 793	2026-07-19 13:14:35.736225
60	Walter, Romaguera and Ernser	Shaun Rempel	Bradly_Wuckert59@hotmail.com	6482287078	605 Oberbrunner Vista Suite 345	2026-07-19 13:14:35.737904
61	Sporer - Kerluke	Silvia Brekke	Dexter_Cassin27@yahoo.com	8861103442	310 Ludie Skyway Apt. 399	2026-07-19 13:14:35.73857
62	Littel, Stanton and Bartoletti	Dr. Joey Senger	Jace.Casper@yahoo.com	8729674149	5989 Luettgen Coves Suite 608	2026-07-19 13:14:35.73907
63	Wolf - Renner	Armando Spinka	Triston.Hermann@gmail.com	5618179502	701 Grady Road Suite 547	2026-07-19 13:14:35.739573
64	Kris, Wunsch and Dare	Erica Fadel	Alysha.Huel@yahoo.com	6064466097	2417 Legros Cape Apt. 204	2026-07-19 13:14:35.740076
65	Brekke LLC	Marsha Swaniawski	Camren.Auer1@yahoo.com	3240719220	7828 Gerhard Roads Suite 224	2026-07-19 13:14:35.740562
66	Schaden, Roberts and Wolf	Lance Altenwerth	Nova.Rath@gmail.com	4743848143	643 Mante Land Apt. 871	2026-07-19 13:14:35.741046
67	Medhurst LLC	Russell Ebert	Brigitte_Reichert@gmail.com	1658883721	85313 Marty Terrace Apt. 361	2026-07-19 13:14:35.74155
68	Waters Group	Dr. Kara Konopelski	Mary.Kessler42@yahoo.com	7150477619	81457 Gibson Dam Suite 408	2026-07-19 13:14:35.742066
69	Ernser, Emard and Bednar	June Bruen	Muriel11@yahoo.com	4238837144	4846 Howe Center Apt. 689	2026-07-19 13:14:35.742565
70	Thiel Group	Dr. Elijah Hilll	Kaitlin54@hotmail.com	4560750903	332 Leuschke Shores Suite 141	2026-07-19 13:14:35.743079
71	Jenkins - Grant	Frances Fay	Dino85@hotmail.com	5695610695	983 Oak Road Suite 650	2026-07-19 13:14:35.743548
72	Hansen and Sons	Emilio Stehr	Elise_Hermiston95@gmail.com	6122279699	191 Casper Mountains Suite 117	2026-07-19 13:14:35.744036
73	Jast - Hoppe	Randolph Pollich-Gusikowski	Reece.Kling@gmail.com	4539144739	1415 Schulist Vista Apt. 508	2026-07-19 13:14:35.744509
74	Schmidt, Spencer and Schowalter	Gerald Ferry	Lyric_Gibson91@gmail.com	1561830048	4640 Rippin Point Suite 226	2026-07-19 13:14:35.745015
75	Turner Group	Lloyd Nader	Elenora.Labadie@yahoo.com	5620317794	3105 Dewitt Club Apt. 917	2026-07-19 13:14:35.745499
76	Kreiger LLC	Eleanor Flatley DVM	Dayna_Heller@hotmail.com	2080146757	754 Nicolas Crossing Suite 263	2026-07-19 13:14:35.745984
77	Konopelski, Lowe and Roberts	Brian Ratke	Jamarcus.Marvin44@gmail.com	9024091409	2225 Jo Avenue Suite 538	2026-07-19 13:14:35.746518
78	Kuphal, Bailey and Balistreri	Margaret Goyette	Ulises.Marks@yahoo.com	3847946206	32054 W 8th Street Apt. 970	2026-07-19 13:14:35.747075
79	DuBuque, Wehner and Kihn	Guy Runolfsdottir	Trevion.Hudson@hotmail.com	8979383390	437 Woodlands Avenue Apt. 502	2026-07-19 13:14:35.747554
80	Ratke, Gerlach and Kassulke	Jennie Sipes	Hugh_Bartell@hotmail.com	8644463010	72412 Aiyana Road Apt. 712	2026-07-19 13:14:35.748014
81	Boehm - Ward	Kelly Lehner	Arnaldo_McCullough34@gmail.com	7389262766	669 Leonard Rapids Suite 621	2026-07-19 13:14:35.748506
82	Shields LLC	Dr. Rufus Thiel II	Therese.Veum@gmail.com	1117357547	898 Herminio Parks Apt. 654	2026-07-19 13:14:35.748994
83	Dickinson, Kshlerin and Beatty	Julio Adams	Alisa_Nolan31@gmail.com	5498300425	96266 Glover Stream Apt. 431	2026-07-19 13:14:35.74952
84	Schiller - Gislason	Ebony Williamson-Frami	Ardella_OConnell-Zieme6@yahoo.com	3479743844	113 The Mews Apt. 279	2026-07-19 13:14:35.750014
85	Graham, Predovic and Lynch	Mrs. Velma Krajcik	Tyson_Willms37@yahoo.com	3417623290	360 Yundt View Apt. 641	2026-07-19 13:14:35.750536
86	Heathcote LLC	Willard Mann	Lurline.Bechtelar@yahoo.com	6457315431	110 Gutkowski Parks Apt. 645	2026-07-19 13:14:35.751045
87	Schaden, Harvey and Feeney	Colin Trantow	Kiana_Marvin16@gmail.com	3154811786	7675 Turcotte Shoal Apt. 524	2026-07-19 13:14:35.751562
88	Boyle and Sons	Gina Terry	Etha_OKon91@gmail.com	6846208045	141 Kieran Walks Apt. 787	2026-07-19 13:14:35.752153
89	Abbott Inc	Tanya Rice	Marielle.Wuckert97@gmail.com	2440694726	267 Riverside Apt. 627	2026-07-19 13:14:35.752618
90	Gutmann - Olson	Mr. Edward Hammes	Malika_Mosciski18@yahoo.com	2174084537	805 Carroll Crossroad Apt. 125	2026-07-19 13:14:35.75342
91	Bashirian - Herzog	Marc Huel	Dennis_Lemke@yahoo.com	7881617398	78293 Bechtelar Shores Suite 619	2026-07-19 13:14:35.75402
92	Braun - Watsica	Loren Simonis	Eula.Heaney@hotmail.com	8645575797	7679 Feeney Motorway Apt. 962	2026-07-19 13:14:35.754567
93	Waelchi LLC	Winifred Hodkiewicz-Heller	Agnes49@gmail.com	2816020480	281 Johan Highway Suite 855	2026-07-19 13:14:35.755084
94	Lubowitz, Ferry and Effertz	Mr. Felipe Braun	Valentin.Lynch-Hyatt76@yahoo.com	5501941640	6098 Kuphal Spur Suite 463	2026-07-19 13:14:35.755582
95	O'Kon - Auer	Brad Goyette	Frieda12@yahoo.com	6187770358	14413 Franklin Street Suite 538	2026-07-19 13:14:35.756085
96	Kirlin - Lowe	Gayle Beer V	Rosamond86@yahoo.com	5594038879	57012 Pacocha Parkway Apt. 994	2026-07-19 13:14:35.756599
97	Lowe - Hilpert	Krista Kovacek	Murray79@hotmail.com	7779255104	626 Cow Lane Apt. 491	2026-07-19 13:14:35.757116
98	Franey Inc	Mr. Ervin Schamberger	Deangelo82@gmail.com	2759979078	51075 Turcotte Plaza Suite 484	2026-07-19 13:14:35.757719
99	Funk, Casper and Rempel	Angela Schultz	Daphney44@yahoo.com	5744258254	9316 Ursula Grove Apt. 983	2026-07-19 13:14:35.758386
100	Kilback and Sons	Garrett Mann	Myah.Haag@yahoo.com	9484041050	197 Renner Highway Suite 104	2026-07-19 13:14:35.758888
101	Thompson - Dach	Dr. Candice Maggio	Arjun72@yahoo.com	5622691433	36485 Farm Close Suite 388	2026-07-19 13:14:35.759363
102	Carroll, Parker and Beier	Claude Friesen	Abigale7@yahoo.com	4630691487	2280 E Washington Avenue Suite 329	2026-07-19 13:14:35.759892
103	Bartoletti, Bins and Quigley	Alfred Hickle	Ken_Hauck@yahoo.com	9455736609	802 W 14th Street Apt. 368	2026-07-19 13:14:35.760357
104	Barton - Rempel	Drew Lind	Mabel.Cummerata@gmail.com	7495210011	378 Deonte Forks Suite 922	2026-07-19 13:14:35.760861
\.


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 12, true);


--
-- Name: products_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.products_id_seq', 101, true);


--
-- Name: suppliers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.suppliers_id_seq', 104, true);


--
-- Name: categories categories_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_name_key UNIQUE (name);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);


--
-- Name: products products_sku_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_sku_key UNIQUE (sku);


--
-- Name: suppliers suppliers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_email_key UNIQUE (email);


--
-- Name: suppliers suppliers_phone_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_phone_key UNIQUE (phone);


--
-- Name: suppliers suppliers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_pkey PRIMARY KEY (id);


--
-- Name: suppliers suppliers_supplier_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.suppliers
    ADD CONSTRAINT suppliers_supplier_name_key UNIQUE (supplier_name);


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict 6kXhNv6e6VPEP7e5JlDBVj7JA7wfkQunvXK1PCIkbwl8ccvYs0rPF8tB0362KgR

