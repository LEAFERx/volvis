1. What is your problem/project?

Our Topic is Volume Visualization with Raycasting and Transfer Function, which will take in abstract data obtained by sensors and output the reconstruction of the 3D model with internal information that user intended to get as visible material attached to it.

Since human have better understanding through images rather than packs of datasets, a concise and visual model is required to provide better comprehension. Currently the technique is widely used in engineering and medical area, like simulating the force interactions of a design product or displaying computed tomography (CT) , magnetic resonance (MRI) data in different opacity for different tissues.

2. How to resolve your problem from the perspective of algorithms/theory/methods/equations, etc.?

We use the raymarching method to realize the volume visualization. To produce a physically realistic image from volumetric data, we need to calculate the absorption, emission and scattering. And since we need to make the visualization result intractable and render in real-time, we dump the scattering calculation part for efficiency.

######这可以加一张emission，absorption和scattering的示意图##########

######这可以加一张pipeline图############

We’ll render the bounding box as a unit $[0,1]$ cube, and scale it by the object axes to support non-uniform sized volumes (According to .raw.info file). The eye position is transformed into the unit cube, and the ray direction is computed in this space. Raymarching in the unit cube space will allow us to simplify our texture sampling operations during the raymarching in the fragment shader, since we’ll already be in the $[0,1]$ texture coordinate space of the 3D volume.

We first generate a vertex shader to get the transform of all the vertices from the raw file of the object based on the user’s camera position, and compute the ray direction and eye position in the object space, and pass them to the fragment shader for the raymarching process.

Then, to provide interactivity, we allow user to adjust a curve which will map certain feature in the object to specific color and opacity, and the mapping function is called Transfer Function. It would give the render abilities like highlighting regions of interest with different colors, or making noise and background regions transparent according to users' demand.

Finally, when all preparations are done, we come to the raymarching part. The basic consideration of representing 3D image by ray marching is to obtain each ray intensities captured by human eye (camera perspective). Rays passing through the object and reaching the eye accumulate the color and opacity emitted by the object, and are decreased as they traverse it due to absorption by the object. Thus we can consider it reversely that we shoot rays from human eye and sample the color and opacity data from the object raw data, process them with the transfer function and accumulate them to receive the rendering result. Given a ray from eye which enters the object at $s = 0$ and exits at $s = L$, we accumulate the emitted color $C(s)$ and absorption $\mu(s)$ at each point $s$ along the way as follows: $C(r) = \sum^N_{i=0}{C(i\Delta s)\alpha(i\Delta s)\prod^{i-1}_{j=0} (1-\alpha(j\Delta s))}$, where $\alpha = \mu(i\Delta s)\Delta s$

The pseudo code of raymarching will perform the followings:

1. Normalize the view ray direction pre-calculated in vertex shader

2. Intersect the view ray against the object bounds to determine the ray's interval $[start,end]$ to raymarch over to render the object

3. Compute the step size $\Delta s$ such that each voxel is sampled at least once

4. Starting from the entry point at $s(start)$, step the ray through the object until the exit point at $s(end)$, or break when the object is considered opaque ($\alpha = 1$)

   1. At each point, sample the object and use the transfer function to assign color and opacity

   2. Accumulate the color and opacity along the ray using the front-to-back compositing equation.

      $\hat{C}_i = \hat{C}_{i-1}+(1-\alpha_{i-1})\hat{C}(i\Delta s)$

      $\alpha_i = \alpha_{i-1} + (1-\alpha_{i-1})\alpha(i\Delta s)$

      where finally we use pre-multiplied opacity for color blending: $\hat{C}(i\Delta s) = C(i\Delta s)\alpha(i\Delta s)$



3. Project outcomes, including any comparison, and incremental analysis.
4. Discussion on your project and any limitations.