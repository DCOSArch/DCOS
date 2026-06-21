-- Bulk Inventory Table
CREATE TABLE public.doctor_inventory (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dentist_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  lab_id uuid NOT NULL REFERENCES public.lab_profiles(id) ON DELETE CASCADE,
  material_name text NOT NULL,
  total_units numeric NOT NULL,
  remaining_units numeric NOT NULL CHECK (remaining_units >= 0),
  locked_price text,
  created_at timestamptz DEFAULT now()
);

-- Chat System Tables
CREATE TABLE public.order_chats (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id uuid NOT NULL UNIQUE REFERENCES public.cases(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  chat_id uuid NOT NULL REFERENCES public.order_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.doctor_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Dentists can view their own inventory" ON public.doctor_inventory 
  FOR SELECT USING (auth.uid() = dentist_id);

CREATE POLICY "Labs can view inventory allocated to them" ON public.doctor_inventory 
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.users WHERE lab_id = doctor_inventory.lab_id)
  );

-- Chat access: Dentists and Labs involved in the case can access the chat
CREATE POLICY "Case participants can access order chats" ON public.order_chats
  FOR SELECT USING (
    auth.uid() IN (
      SELECT dentist_id FROM public.cases WHERE id = order_chats.case_id
    ) OR
    auth.uid() IN (
      SELECT u.id FROM public.users u JOIN public.cases c ON u.lab_id = c.lab_id WHERE c.id = order_chats.case_id
    )
  );

CREATE POLICY "Case participants can access chat messages" ON public.chat_messages
  FOR SELECT USING (
    auth.uid() IN (
      SELECT c.dentist_id FROM public.cases c JOIN public.order_chats oc ON c.id = oc.case_id WHERE oc.id = chat_messages.chat_id
    ) OR
    auth.uid() IN (
      SELECT u.id FROM public.users u JOIN public.cases c ON u.lab_id = c.lab_id JOIN public.order_chats oc ON c.id = oc.case_id WHERE oc.id = chat_messages.chat_id
    )
  );
