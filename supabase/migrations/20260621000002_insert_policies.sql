-- ==========================================
-- 20260621000002_insert_policies.sql
-- Missing INSERT policies for tables
-- ==========================================

-- Allow Dentists to insert cases
CREATE POLICY "Dentists can create cases" ON public.cases
  FOR INSERT WITH CHECK (auth.uid() = dentist_id);

-- Allow anyone (or authenticated users) to insert lab profiles
CREATE POLICY "Anyone can create a lab profile" ON public.lab_profiles
  FOR INSERT WITH CHECK (true);

-- Allow participants to insert chat messages
CREATE POLICY "Case participants can insert chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    (
      auth.uid() IN (
        SELECT c.dentist_id FROM public.cases c JOIN public.order_chats oc ON c.id = oc.case_id WHERE oc.id = chat_messages.chat_id
      ) OR
      auth.uid() IN (
        SELECT u.id FROM public.users u JOIN public.cases c ON u.lab_id = c.lab_id JOIN public.order_chats oc ON c.id = oc.case_id WHERE oc.id = chat_messages.chat_id
      )
    )
  );

-- Also need UPDATE policies if we plan to change case status
CREATE POLICY "Labs can update case status" ON public.cases
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.users WHERE lab_id = cases.lab_id)
  );
